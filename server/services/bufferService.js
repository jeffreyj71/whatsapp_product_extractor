require('dotenv').config();

let windowMs = parseInt(process.env.BUFFER_WINDOW_SECONDS || '60', 10) * 1000;

// Map of `${chatId}::${senderId}` -> { items: [], timer }
const buffers = new Map();

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
  }, windowMs);

  buffers.get(key).timer = timer;
}

function flushAll(onFlush) {
  for (const [key, buf] of buffers.entries()) {
    clearTimeout(buf.timer);
    const [chatId, senderId] = key.split('::');
    onFlush(chatId, senderId, buf.items);
  }
  buffers.clear();
}

function getWindowSeconds() { return windowMs / 1000; }
function setWindowSeconds(val) { windowMs = Math.max(1, parseInt(val, 10)) * 1000; }

module.exports = { add, flushAll, getWindowSeconds, setWindowSeconds };
