const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/eventController');
const { eventMediaUpload } = require('../../utils/fileUpload');
const { ensureAdmin } = require('../../middleware/auth');

// Event Management Routes
router.get('/', eventController.listEvents);
router.get('/new', ensureAdmin, eventController.showCreateForm);
router.post('/', ensureAdmin, eventController.createEvent);

// Media Management Routes
router.get('/:id/media', ensureAdmin, eventController.showMediaManager);
router.post('/:id/media', ensureAdmin, eventMediaUpload, eventController.uploadMedia);
router.delete('/:id/media/:mediaId', ensureAdmin, eventController.deleteMedia);

module.exports = router;