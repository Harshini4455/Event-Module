const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const upload = require('../config/multer');
const { getEvents, saveEvents, generateId } = require('../utils/helpers');
require('dotenv').config();
const eventController = require('../controllers/eventController');
const { eventMediaUpload  } = require('../utils/fileUpload');
const { ensureAdmin } = require('../middleware/auth');

// Event CRUD Routes
// router.get('/new', ensureAdmin, eventController.renderEventForm);
// router.post('/', ensureAdmin, eventController.createEvent);

// Media Management Routes
// router.get('/:id/media', ensureAdmin, eventController.renderMediaManager);
// router.post('/:id/media', 
//   ensureAdmin,
//   uploadEventMedia.array('media', 30),
//   eventController.addEventMedia
// );

// Event Management Routes
router.get('/events', ensureAdmin, eventController.listEvents);
router.get('/events/new', ensureAdmin, eventController.showCreateForm);
router.post('/events', ensureAdmin, eventController.createEvent);

// Event Media Management Routes
router.get('/events/:id/media', ensureAdmin, eventController.showMediaManager);
router.post('/events/:id/media', ensureAdmin, eventMediaUpload, eventController.uploadMedia);
router.delete('/events/:id/media/:mediaId', ensureAdmin, eventController.deleteMedia);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'event-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Only image files are allowed!'));
};

module.exports = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, process.env.UPLOAD_PATH || 'public/uploads');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage });

// Middleware to check admin authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

// Login routes
router.get('/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Simple comparison (for development)
    if (username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
    }

    res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid credentials'
    });
});



// Admin dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    const events = getEvents();
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        events
    });
});


// Event management routes
router.get('/events/new', isAuthenticated, (req, res) => {
    res.render('admin/add-event', { title: 'Add New Event' });
});

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const { readEventsData, saveEventsData } = require('../helpers/eventHelpers');

router.post('/events', isAuthenticated, upload.array('eventImage', 5), async (req, res) => {
    try {
        const { title, category, date, description, featured } = req.body;

        // Handle file uploads
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => '/uploads/' + file.filename);
        } else {
            images = ['/images/default-event.jpg']; // Default image
        }

        const newEvent = {
            id: Date.now(),
            title,
            category,
            date,
            description: description || "No description provided",
            images,
            mainImage: images[0],
            featured: featured === 'on',
            createdAt: new Date().toISOString()
        };

        // Read and update events
        const events = await readEventsData();
        events.push(newEvent);
        await saveEventsData(events);

        req.session.success = `Event added with ${images.length} images!`;
        return res.redirect('/admin/dashboard');

    } catch (err) {
        console.error('Error adding event:', err);

        // Cleanup uploaded files if error occurred
        if (req.files?.length) {
            req.files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file.filename));
            });
        }

        req.session.error = 'Failed to add event: ' + err.message;
        return res.redirect('/admin/events/new');
    }
});


// Edit Event Routes


router.get('/events/edit/:id', isAuthenticated, (req, res) => {
    const events = require('../data/events.json');
    const event = events.find(e => e.id === parseInt(req.params.id));
    if (!event) return res.status(404).render('pages/404', { title: 'Event Not Found' });

    res.render('admin/edit-event', {
        title: 'Edit Event',
        event
    });
});

router.post('/events/update/:id', isAuthenticated, upload.single('eventImage'), (req, res) => {
    let events = require('../data/events.json');
    const eventIndex = events.findIndex(e => e.id === parseInt(req.params.id));

    if (eventIndex === -1) {
        return res.status(404).render('pages/404', { title: 'Event Not Found' });
    }

    const { title, category, date, description, featured } = req.body;
    const updatedEvent = {
        ...events[eventIndex],
        title,
        category,
        date,
        description,
        
        featured: featured === 'on'
    };

    if (req.file) {
        updatedEvent.image = '/uploads/' + req.file.filename;
    }

    events[eventIndex] = updatedEvent;
    fs.writeFileSync('./data/events.json', JSON.stringify(events, null, 2));

    res.redirect('/admin/dashboard');
});

// Helper function to delete image files
const deleteImageFile = (imagePath) => {
    if (!imagePath) return;
    
    try {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Deleted image file:', fullPath);
        }
    } catch (err) {
        console.error('Error deleting image file:', err);
    }
};
// For deleting images during edit/delete operations
const deleteEventImage = (imageUrl) => {
    if (!imageUrl) return;

    try {
        const filename = path.basename(imageUrl);
        const imagePath = path.join(__dirname, '../uploads', filename);

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Deleted image:', filename);
        }
    } catch (err) {
        console.error('Image deletion failed:', err);
    }
};

// Delete Event Route
router.get('/events/delete/:id', isAuthenticated, (req, res) => {
    try {
        // Load events data
        const eventsPath = path.join(__dirname, '../data/events.json');
        let events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

        // Find event to delete
        const eventId = parseInt(req.params.id);
        const eventIndex = events.findIndex(e => e.id === eventId);

        if (eventIndex === -1) {
            req.flash('error', 'Event not found');
            return res.redirect('/admin/events');
        }

        // Delete associated images
        const eventToDelete = events[eventIndex];
        if (eventToDelete.eventImage) {
            deleteImageFile(eventToDelete.eventImage);
        }
        
        // Delete from database (JSON file)
        events.splice(eventIndex, 1);
        fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));

        req.flash('success', 'Event deleted successfully');
        res.redirect('/admin/events');
    } catch (err) {
        console.error('Delete error:', err);
        req.flash('error', 'Failed to delete event');
        res.redirect('/admin/events');
    }
});
// router.get('/events/delete/:id', isAuthenticated, (req, res) => {
//     let events = require('../data/events.json');
//     events = events.filter(e => e.id !== parseInt(req.params.id));
//     fs.writeFileSync('./data/events.json', JSON.stringify(events, null, 2));

//     res.redirect('/admin/dashboard');
// });
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Logout error:', err);
        res.redirect('/admin/login');
    });
});
module.exports = router;