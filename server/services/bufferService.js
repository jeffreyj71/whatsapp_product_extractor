require('dotenv').config();

const WINDOW_MS = parseInt(process.env.BUFFER_WINDOW_SECONDS || '60', 10) * 1000;

// Map of `${chatId}::${senderId}` -> { items: [], timer }
const buffers = new Map();

/**
 * Add a message item to the sender's buffer.
 * Resets the flush timer on each new item.
 * @param {string} chatId
 * @param {string} senderId
 * @param {object} item  - { text, mediaPath, mimetype, timestamp, ... }
 * @param {function} onFlush - called with (chatId, senderId, items[]) when window closes
 */
function add(chatId, senderId, item, onFlush) {
  const key = `${chatId}::${senderId}`;

  if (buffers.has(key)) {
    clearTimeout(buffers.get(key).timer);
    buffers.get(key).items.push(item);
  } else {
    buffers.set(key, { items: [item] });
  }

  const timer = setTimeout(() => {
    const buf = buffers.get(key);
    if (buf) {
      buffers.delete(key);
      onFlush(chatId, senderId, buf.items);
    }
  }, WINDOW_MS);

  buffers.get(key).timer = timer;
}

/** Flush all pending buffers immediately (e.g. on shutdown). */
function flushAll(onFlush) {
  for (const [key, buf] of buffers.entries()) {
    clearTimeout(buf.timer);
    const [chatId, senderId] = key.split('::');
    onFlush(chatId, senderId, buf.items);
  }
  buffers.clear();
}

module.exports = { add, flushAll };
