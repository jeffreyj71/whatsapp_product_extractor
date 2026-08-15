const { randomUUID } = require('crypto');

// In-memory by design: detected reminders are available for this server session.
const events = [];

function addEvent(event) {
  const stored = {
    id: randomUUID(),
    title: event.title || 'Event',
    date: event.date,
    rawText: event.rawText || '',
    sender: event.sender || '',
    senderId: event.senderId || '',
    detectedAt: Date.now(),
  };
  events.push(stored);
  return stored;
}

function getAllEvents() {
  return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getEvent(id) {
  return events.find((event) => event.id === id) || null;
}

module.exports = { addEvent, getAllEvents, getEvent };
