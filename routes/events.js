const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Sample event data - in a real app, this would come from a database
let events = [
    {
        id: 1,
        title: "Tech Symposium",
        category: "Technical",
        date: "2023-11-15",
        description: "Annual technical symposium with competitions and workshops.",
        images: [
          "/uploads/event-1743613502419-712960249.jpg"
        ],
        mainImage: "/uploads/event-1743613502419-712960249.jpg"
    },
    // Add more sample events...
];


router.get('/', (req, res) => {
    try {
      const eventsPath = path.join(__dirname, '../data/events.json');
      const events = JSON.parse(fs.readFileSync(eventsPath));
      
      res.render('pages/index', {
        title: 'College Event Gallery',
        events,
        featuredEvents: events.filter(event => event.featured)
      });
    } catch (err) {
      console.error('Error reading events:', err);
      res.status(500).render('pages/500', { title: 'Server Error' });
    }
  });

  router.get('/events', (req, res) => {
    try {
      const eventsPath = path.join(__dirname, '../data/events.json');
      let events = JSON.parse(fs.readFileSync(eventsPath));
      const category = req.query.category;
      
      if (category) {
        events = events.filter(event => 
          event.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      res.render('pages/events', {
        title: 'All Events',
        events,
        currentCategory: category || 'All'
      });
    } catch (err) {
      console.error('Error reading events:', err);
      res.status(500).render('pages/500', { title: 'Server Error' });
    }
  });

  router.get('/events/:id', (req, res) => {
    try {
      const eventsPath = path.join(__dirname, '../data/events.json');
      const events = JSON.parse(fs.readFileSync(eventsPath));
      const eventId = parseInt(req.params.id);  // Ensure ID is a number
      
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        return res.status(404).render('pages/404', { 
          title: 'Event Not Found',
          message: 'The event you requested does not exist.'
        });
      }
      
      // Get 3 related events (same category, excluding current)
      const relatedEvents = events
        .filter(e => e.category === event.category && e.id !== event.id)
        .slice(0, 3);
      
      res.render('pages/event-details', {
        title: event.title,
        event,
        relatedEvents
      });
      
    } catch (err) {
      console.error('Error loading event:', err);
      res.status(500).render('pages/500', { title: 'Server Error' });
    }
  });



module.exports = router;