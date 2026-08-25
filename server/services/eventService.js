const chrono = require('chrono-node');
const { createEvent } = require('ics');
const logger = require('../utils/logger');

/**
 * Detect the first natural-language date/time reference in a message.
 * This is intentionally fail-safe so event detection never interrupts the
 * normal WhatsApp message pipeline.
 */
function detectEvent(text, referenceDate = new Date()) {
  try {
    if (typeof text !== 'string' || !text.trim()) return null;

    // Resolve ambiguous relative references (for example, "Friday") forward
    // from the time this message is processed, never to a prior occurrence.
    const matches = chrono.parse(text, referenceDate, { forwardDate: true });
    const match = matches[0];
    if (!match) return null;

    const date = match.start.date();
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const title = text
      .slice(0, match.index)
      .concat(text.slice(match.index + match.text.length))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60) || 'Event';

    return { title, date, rawText: text };
  } catch (err) {
    logger.warn(`Event detection failed: ${err.message}`);
    return null;
  }
}

/** Generate a one-hour iCalendar event with its selected display reminders. */
function generateICS({ title, date, description, reminderOffsets = [30] } = {}) {
  try {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const result = createEvent({
      title: title || 'Event',
      description: description || '',
      start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
      duration: { hours: 1 },
      alarms: reminderOffsets.map((minutes) => ({
        action: 'display',
        description: 'Event reminder',
        trigger: { minutes, before: true },
      })),
    });

    if (result.error || !result.value) {
      logger.warn(`ICS generation failed: ${result.error?.message || 'unknown error'}`);
      return null;
    }
    return result.value;
  } catch (err) {
    logger.warn(`ICS generation failed: ${err.message}`);
    return null;
  }
}

module.exports = { detectEvent, generateICS };
