require('dotenv').config();
require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const app = express();

const mongoose = require('mongoose');
const passport = require('passport');
const connectDB = require('./config/db');

const flash = require('connect-flash');
app.use(flash());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'panipuri',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Add this to app.js before routes

// Validate admin credentials on startup
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    console.error('ERROR: Admin credentials not configured in .env file');
    process.exit(1);
}

// Test password hash format
if (!process.env.ADMIN_PASSWORD_HASH.startsWith('$2a$')) {
    console.error('ERROR: ADMIN_PASSWORD_HASH must be a valid bcrypt hash');
    process.exit(1);
}

// Routes
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');

app.use('/', eventRoutes);
app.use('/admin', adminRoutes);
const adminEventRoutes = require('./routes/admin/events');
app.use('/admin/events', adminEventRoutes);
// Error handling
app.use((req, res, next) => {
    res.status(404).render('pages/404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('pages/500', { title: 'Server Error' });
});


// Passport config
require('./config/passport');
// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.user || null;
    next();
  });


  // More robust error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Perform cleanup if needed
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add this to app.js temporarily
console.log('Admin username:', process.env.ADMIN_USERNAME);
console.log('Admin username:', process.env.ADMIN_USERNAME);
// console.log('Password hash exists:', !!process.env.ADMIN_PASSWORD_HASH);

const requiredVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SESSION_SECRET'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.error('Please check your .env file');
    process.exit(1);
  }
});

console.log('✅ Environment variables loaded successfully');

console.log('Expected:', process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
// console.log('Received:', req.body.username, req.body.password);
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));
  
  // Add event routes
  app.use('/api/events', require('./routes/eventRoutes'));
  
// Database connection
connectDB();



  
// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});