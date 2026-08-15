const express = require('express');
const { getAllEvents, getEvent } = require('../services/eventStore');
const { generateICS } = require('../services/eventService');

const router = express.Router();

router.get('/events', (_req, res) => {
  res.json({ events: getAllEvents() });
});

router.get('/events/:id/ics', (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const ics = generateICS({ title: event.title, date: new Date(event.date), description: event.rawText });
  if (!ics) return res.status(500).json({ error: 'Could not generate calendar file' });

  const filename = `${event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'event'}.ics`;
  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(ics);
});

module.exports = router;
