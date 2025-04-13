const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const getAdminDashboard = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'username');
    res.render('admin/dashboard', { 
      events, 
      user: req.user,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      position: event.media.length
    }));

    event.media.push(...files);
    await event.save();

    res.json({ message: 'Files uploaded successfully', media: files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateMedia = async (req, res) => {
  try {
    const { eventId, mediaId } = req.params;
    const { position, caption } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const mediaItem = event.media.id(mediaId);
    if (!mediaItem) return res.status(404).json({ error: 'Media not found' });

    if (position !== undefined) mediaItem.position = position;
    if (caption !== undefined) mediaItem.caption = caption;

    await event.save();
    res.json({ message: 'Media updated successfully', media: mediaItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { eventId, mediaId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const mediaItem = event.media.id(mediaId);
    if (!mediaItem) return res.status(404).json({ error: 'Media not found' });

    // Remove file from server
    const filePath = path.join(__dirname, '../public', mediaItem.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    event.media.pull(mediaId);
    await event.save();

    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
// Event CRUD Operations
exports.getAllEvents = async (req, res) => {
    try {
      const events = await Event.find().sort({ date: -1 });
      res.render('admin/events', { events });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  };
  
  exports.getNewEventForm = (req, res) => {
    res.render('admin/event-form', { event: null });
  };
  
  exports.createEvent = async (req, res) => {
    try {
      const { title, description, date, location } = req.body;
      
      const newEvent = new Event({
        title,
        description,
        date,
        location,
        createdBy: req.user._id
      });
  
      await newEvent.save();
      req.flash('success_msg', 'Event created successfully');
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  };
  
  exports.getEditEventForm = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/admin/dashboard');
      }
      res.render('admin/event-form', { event });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  };
  
  exports.updateEvent = async (req, res) => {
    try {
      const { title, description, date, location } = req.body;
      
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { title, description, date, location },
        { new: true }
      );
  
      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/admin/dashboard');
      }
  
      req.flash('success_msg', 'Event updated successfully');
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  };
  
  exports.deleteEvent = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        req.flash('error_msg', 'Event not found');
        return res.redirect('/admin/dashboard');
      }
  
      // Delete associated media files
      for (const media of event.media) {
        const filePath = path.join(__dirname, '../public', media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
  
      await Event.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Event deleted successfully');
      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Server Error' });
    }
  };

  module.exports = {
    getAdminDashboard
  };