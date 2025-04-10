const fs = require('fs');
const path = require('path');

module.exports = {
    // Read events from JSON file
    getEvents: () => {
        try {
            const eventsData = fs.readFileSync(path.join(__dirname, '../data/events.json'));
            return JSON.parse(eventsData);
        } catch (err) {
            console.error('Error reading events file:', err);
            return [];
        }
    },

    // Save events to JSON file
    saveEvents: (events) => {
        try {
            fs.writeFileSync(
                path.join(__dirname, '../data/events.json'),
                JSON.stringify(events, null, 2)
            );
            return true;
        } catch (err) {
            console.error('Error writing events file:', err);
            return false;
        }
    },

    // Generate unique ID for new events
    generateId: () => {
        return Date.now();
    }
};