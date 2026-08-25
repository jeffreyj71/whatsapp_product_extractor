const { getAllEvents, markReminderNotified } = require('./eventStore');
const logger = require('../utils/logger');

let timer = null;

function checkReminders(notify) {
  const now = Date.now();
  getAllEvents().forEach((event) => {
    const start = new Date(event.date).getTime();
    if (!Number.isFinite(start) || start <= now) return;

    (event.reminderOffsets || []).forEach((offset) => {
      if (start - offset * 60 * 1000 <= now && !(event.notifiedOffsets || []).includes(offset)) {
        markReminderNotified(event.id, offset);
        notify({ ...event, reminderOffset: offset });
        logger.info(`[EventReminders] Sent ${offset}-minute reminder for ${event.title}`);
      }
    });
  });
}

function start(notify) {
  if (timer) return;
  checkReminders(notify);
  timer = setInterval(() => checkReminders(notify), 60 * 1000);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, checkReminders };
