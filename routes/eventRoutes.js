const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const upload = require('../utils/fileUpload');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// Protected admin routes
router.post('/', ensureAuthenticated, ensureAdmin, eventController.createEvent);
router.put('/:id', ensureAuthenticated, ensureAdmin, eventController.updateEvent);
router.delete('/:id', ensureAuthenticated, ensureAdmin, eventController.deleteEvent);

// Media upload route
router.post(
  '/:id/media',
  ensureAuthenticated,
  ensureAdmin,
  upload.array('media', 30), // Max 30 files
  eventController.uploadEventMedia
);

module.exports = router;