const Event = require('../models/Event');
const fs = require('fs');
const path = require('path');

const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    
    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      createdBy: req.user._id,
      status: 'published'
    });

    await event.save();
    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const  addEventMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      // Clean up uploaded files if event doesn't exist
      req.files.forEach(file => fs.unlinkSync(file.path));
      throw new Error('Event not found');
    }

    const mediaFiles = req.files.map(file => ({
      url: `/uploads/events/${file.filename}`,
      type: file.mimetype.startsWith('image') ? 'image' : 'video'
    }));

    event.media.push(...mediaFiles);
    await event.save();

    req.flash('success', 'Media added successfully');
    res.redirect(`/admin/events/${event._id}/media`);
  } catch (err) {
    console.error(err);
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    req.flash('error', 'Failed to add media');
    res.redirect(`/admin/events/${req.params.id}/media`);
  }
};

const renderEventForm = (req, res) => {
  res.render('admin/events/new', { 
    title: 'Create New Event',
    event: null,
    messages: req.flash()
  });
};

const renderMediaManager = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    res.render('admin/events/media', {
      title: 'Manage Event Media',
      event,
      messages: req.flash()
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Event not found');
    res.redirect('/admin/events');
  }
};

const showMediaManager = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/events');
    }
    res.render('admin/events/media', { event });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load media manager');
    res.redirect('/admin/events');
  }
};

const uploadMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      // Cleanup uploaded files if event doesn't exist
      req.files.forEach(file => fs.unlinkSync(file.path));
      throw new Error('Event not found');
    }

    const mediaFiles = req.files.map(file => ({
      url: `/uploads/events/${file.filename}`,
      type: file.mimetype.startsWith('image') ? 'image' : 'video'
    }));

    event.media.push(...mediaFiles);
    await event.save();

    req.flash('success', 'Media uploaded successfully');
    res.redirect(`/admin/events/${event._id}/media`);
  } catch (err) {
    console.error(err);
    // Cleanup on error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    req.flash('error', 'Failed to upload media');
    res.redirect(`/admin/events/${req.params.id}/media`);
  }
};

const deleteMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const mediaIndex = event.media.findIndex(
      media => media._id.toString() === req.params.mediaId
    );

    if (mediaIndex === -1) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Delete file from server
    const filePath = path.join(__dirname, '../../public', event.media[mediaIndex].url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    event.media.splice(mediaIndex, 1);
    await event.save();

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete media' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location, category },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const uploadEventMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      // Clean up uploaded files if event doesn't exist
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({ message: 'Event not found' });
    }

    const mediaFiles = req.files.map(file => ({
      url: `/uploads/events/${file.filename}`,
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      originalName: file.originalname
    }));

    event.media.push(...mediaFiles);
    await event.save();

    res.status(200).json({
      success: true,
      data: mediaFiles,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    // Clean up files on error
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


module.exports = {
  listEvents: async (req, res) => {
    try {
      const events = await Event.find().sort({ createdAt: -1 });
      res.render('admin/events/list', { events });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to load events');
      res.redirect('/admin');
    }
  },

  showCreateForm: (req, res) => {
    res.render('admin/events/new');
  },

  createEvent: async (req, res) => {
    try {
      const { title, description, date, location } = req.body;
      const event = new Event({
        title,
        description,
        date,
        location,
        createdBy: req.user._id
      });
      await event.save();
      req.flash('success', 'Event created successfully');
      res.redirect('/admin/events');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to create event');
      res.redirect('/admin/events/new');
    }
  },

  showMediaManager: async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        req.flash('error', 'Event not found');
        return res.redirect('/admin/events');
      }
      res.render('admin/events/media', { event });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to load media manager');
      res.redirect('/admin/events');
    }
  },

  uploadMedia: async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        req.files?.forEach(file => fs.unlinkSync(file.path));
        req.flash('error', 'Event not found');
        return res.redirect('/admin/events');
      }

      const mediaFiles = req.files?.map(file => ({
        url: `/uploads/events/${file.filename}`,
        type: file.mimetype.startsWith('image') ? 'image' : 'video'
      })) || [];

      event.media.push(...mediaFiles);
      await event.save();

      req.flash('success', 'Media uploaded successfully');
      res.redirect(`/admin/events/${event._id}/media`);
    } catch (err) {
      console.error(err);
      req.files?.forEach(file => fs.unlinkSync(file.path));
      req.flash('error', 'Failed to upload media');
      res.redirect(`/admin/events/${req.params.id}/media`);
    }
  },

  deleteMedia: async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const mediaItem = event.media.id(req.params.mediaId);
      if (!mediaItem) {
        return res.status(404).json({ success: false, message: 'Media not found' });
      }

      // Delete file from server
      const filePath = path.join(__dirname, '../../../public', mediaItem.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      event.media.pull(mediaItem);
      await event.save();

      res.json({ success: true, message: 'Media deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Failed to delete media' });
    }
  }
};
module.exports ={
  addEventMedia,
  renderEventForm,
  renderMediaManager,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventMedia
}