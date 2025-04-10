const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, '../data/events.json');

async function readEventsData() {
  try {
    const data = await fs.promises.readFile(eventsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create file if it doesn't exist
      await fs.promises.writeFile(eventsPath, '[]');
      return [];
    }
    throw err;
  }
}

async function saveEventsData(events) {
  await fs.promises.writeFile(eventsPath, JSON.stringify(events, null, 2));
}

module.exports = {
  readEventsData,
  saveEventsData
};