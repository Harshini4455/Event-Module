// migrate-events.js
const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, 'data/events.json');

async function migrate() {
  const events = JSON.parse(fs.readFileSync(eventsPath));
  
  const migrated = events.map(event => {
    // If old format with single image
    if (event.image && !event.images) {
      return {
        ...event,
        images: [event.image],
        mainImage: event.image
      };
    }
    // If no images at all
    if (!event.images) {
      return {
        ...event,
        images: ['/images/default-event.jpg'],
        mainImage: '/images/default-event.jpg'
      };
    }
    return event;
  });

  fs.writeFileSync(eventsPath, JSON.stringify(migrated, null, 2));
  console.log('Migration complete!');
}

migrate();