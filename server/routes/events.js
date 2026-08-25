const express = require('express');
const { getAllEvents, getEvent, updateReminderOffsets } = require('../services/eventStore');
const { generateICS } = require('../services/eventService');

const router = express.Router();

router.get('/events', (_req, res) => {
  res.json({ events: getAllEvents() });
});

router.patch('/events/:id/reminders', (req, res) => {
  if (!Array.isArray(req.body.reminderOffsets)) return res.status(400).json({ error: 'reminderOffsets must be an array' });
  const event = updateReminderOffsets(req.params.id, req.body.reminderOffsets);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ event });
});

router.get('/events/:id/ics', (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const ics = generateICS({ title: event.title, date: new Date(event.date), description: event.rawText, reminderOffsets: event.reminderOffsets });
  if (!ics) return res.status(500).json({ error: 'Could not generate calendar file' });

  const slug = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
  const filename = `event-${slug}-${new Date(event.date).toISOString().slice(0, 10)}.ics`;
  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(ics);
});

module.exports = router;
