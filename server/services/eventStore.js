const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

// Events and their reminder preferences share one persisted record so a server
// restart can resume any reminder that has not yet fired.
const STORE_PATH = path.resolve(process.env.OUTPUT_PATH || 'output', 'events.json');
let events = loadEvents();

function loadEvents() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const saved = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    logger.warn(`Could not load saved events: ${err.message}`);
    return [];
  }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(events, null, 2));
  } catch (err) {
    logger.warn(`Could not save events: ${err.message}`);
  }
}

function normaliseOffsets(offsets) {
  const allowed = new Set([15, 30, 60]);
  return [...new Set((Array.isArray(offsets) ? offsets : []).map(Number))]
    .filter((offset) => allowed.has(offset))
    .sort((a, b) => b - a);
}

function addEvent(event) {
  const stored = {
    id: randomUUID(),
    title: event.title || 'Event',
    date: event.date instanceof Date ? event.date.toISOString() : event.date,
    rawText: event.rawText || '',
    sender: event.sender || '',
    senderId: event.senderId || '',
    reminderOffsets: normaliseOffsets(event.reminderOffsets || [30]),
    notifiedOffsets: [],
    detectedAt: Date.now(),
  };
  events.push(stored);
  persist();
  return stored;
}

function getAllEvents() {
  return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getEvent(id) {
  return events.find((event) => event.id === id) || null;
}

function updateReminderOffsets(id, offsets) {
  const event = getEvent(id);
  if (!event) return null;
  event.reminderOffsets = normaliseOffsets(offsets);
  event.notifiedOffsets = (event.notifiedOffsets || []).filter((offset) => event.reminderOffsets.includes(offset));
  persist();
  return event;
}

function markReminderNotified(id, offset) {
  const event = getEvent(id);
  if (!event) return;
  event.notifiedOffsets = [...new Set([...(event.notifiedOffsets || []), offset])];
  persist();
}

module.exports = { addEvent, getAllEvents, getEvent, updateReminderOffsets, markReminderNotified };
