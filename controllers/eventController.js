const Event = require('../models/Event');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../cloudinary'); 

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;
    
    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      createdBy: req.user._id
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

exports.getAllEvents = async (req, res) => {
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

exports.getEventById = async (req, res) => {
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

exports.updateEvent = async (req, res) => {
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

exports.deleteEvent = async (req, res) => {
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

exports.uploadEventMedia = async (req, res) => {
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

exports.getEvents = async (req, res) => {
  try {
      const events = await Event.find({});
      res.render('admin/events', { events });
  } catch (err) {
      console.error(err);
      res.redirect('/admin/dashboard');
  }
};

exports.getAddEvent = (req, res) => {
  res.render('admin/add-event');
};

exports.postAddEvent = async (req, res) => {
  try {
      // Validate required fields
      const { name, date, description, location, category } = req.body;
      if (!name || !date || !description || !location|| !category) {
          req.flash('error', 'All fields are required');
          return res.redirect(req.get('Referrer') || '/admin/events/add');
      }

      // Create event with creator
      const event = new Event({
          name,
          date: new Date(date),
          description,
          location,
          category,
          createdBy: req.user?._id || null, // Handle both authenticated and unauthenticated cases
          images: [],
          videos: []
      });

      // Process uploads
      if (req.files?.images) {
          event.images = req.files.images.map(f => ({
              path: f.path,
              filename: f.filename
          }));
      }

      await event.save();
      req.flash('success', 'Event created successfully');
      return res.redirect('/admin/events');

  } catch (err) {
      console.error('Error:', err);
      req.flash('error', 'Failed to create event: ' + err.message);
      return res.redirect(req.get('Referrer') || '/admin/events/add');
  }
};

exports.getEditEvent = async (req, res) => {
  try {
      const event = await Event.findById(req.params.id);
      res.render('admin/edit-event', { event });
  } catch (err) {
      console.error(err);
      res.redirect('/admin/events');
  }
};

exports.postEditEvent = async (req, res) => {
  try {
      const { name, date, description, location } = req.body;
      const event = await Event.findById(req.params.id);
      
      event.name = name;
      event.date = date;
      event.description = description;
      event.location = location;

      // Handle new image uploads
      if (req.files.images) {
          event.images.push(...req.files.images.map(f => ({
              path: f.path,
              filename: f.filename
          })));
      }

      // Handle new video uploads
      if (req.files.videos) {
          event.videos.push(...req.files.videos.map(f => ({
              path: f.path,
              filename: f.filename
          })));
      }

      await event.save();
      res.redirect('/admin/events');
  } catch (err) {
      console.error(err);
      res.redirect(`/admin/events/edit/${req.params.id}`);
  }
};

exports.deleteEvents = async (req, res) => {
  try {
      await Event.findByIdAndDelete(req.params.id);
      res.redirect('/admin/events');
  } catch (err) {
      console.error(err);
      res.redirect('/admin/events');
  }
};

exports.deleteImage = async (req, res) => {
  try {
      const { id, imageId } = req.params;
      const event = await Event.findById(id);
      
      // Remove image from Cloudinary and array
      const image = event.images.id(imageId);
      await cloudinary.uploader.destroy(image.filename);
      event.images.pull(imageId);
      
      await event.save();
      res.redirect(`/admin/events/edit/${id}`);
  } catch (err) {
      console.error(err);
      res.redirect('/admin/events');
  }
};

exports.deleteVideo = async (req, res) => {
  try {
      const { id, videoId } = req.params;
      const event = await Event.findById(id);
      
      // Remove video from Cloudinary and array
      const video = event.videos.id(videoId);
      await cloudinary.uploader.destroy(video.filename);
      event.videos.pull(videoId);
      
      await event.save();
      res.redirect(`/admin/events/edit/${id}`);
  } catch (err) {
      console.error(err);
      res.redirect('/admin/events');
  }
};