const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, 'data/events.json');
const events = JSON.parse(fs.readFileSync(eventsPath));

const migrated = events.map(event => {
  // Fix image paths
  const fixPath = (imgPath) => {
    if (!imgPath) return 'images/default-event.jpg';
    return imgPath.replace(/^public\\?\\/, '')
                 .replace(/^uploads\\?\\/, 'uploads/');
  };

  return {
    ...event,
    images: event.images?.map(fixPath) || [fixPath(event.image)],
    mainImage: fixPath(event.mainImage || event.image)
  };
});

fs.writeFileSync(eventsPath, JSON.stringify(migrated, null, 2));
console.log(`Migrated ${events.length} events`);