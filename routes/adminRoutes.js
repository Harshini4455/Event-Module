const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const fileUpload = require('../utils/fileUpload');
const { ensureAdmin } = require('../middleware/auth');

// Admin Dashboard
router.get('/dashboard', ensureAdmin, adminController.getAdminDashboard);

// Media Handling Routes
router.post('/events/:eventId/media', 
  ensureAdmin,
  fileUpload.array('media', 30), // Allow up to 30 files
  adminController.uploadMedia
);

router.put('/events/:eventId/media/:mediaId', 
  ensureAdmin,
  adminController.updateMedia
);

router.delete('/events/:eventId/media/:mediaId', 
  ensureAdmin,
  adminController.deleteMedia
);

module.exports = router;