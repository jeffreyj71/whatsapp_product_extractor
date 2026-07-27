const logger = require('../utils/logger');

/**
 * In-memory tracker: chatId -> { chatId, senderName, lastIncomingAt, awaitingReply, lastRepliedAt }
 *
 * Any incoming message marks a chat as "awaiting reply". Any outgoing message to that
 * same chat (sent from this WhatsApp account) clears that flag. Resets in memory on
 * server restart — it reflects "since this app started running", not a permanent history.
 */
const chats = new Map();

function markIncoming(chatId, senderName) {
  if (!chatId) return;
  const existing = chats.get(chatId) || {};
  chats.set(chatId, {
    ...existing,
    chatId,
    senderName: senderName || existing.senderName || chatId,
    lastIncomingAt: Date.now(),
    awaitingReply: true,
  });
}

function markReplied(chatId) {
  if (!chatId) return;
  const existing = chats.get(chatId);
  if (!existing) return;
  if (!existing.awaitingReply) return;
  chats.set(chatId, {
    ...existing,
    awaitingReply: false,
    lastRepliedAt: Date.now(),
  });
  logger.info(`[ReplyTracker] Marked replied: ${existing.senderName || chatId}`);
}

function getStatus(chatId) {
  return chats.get(chatId) || null;
}

function getAllPending() {
  return [...chats.values()]
    .filter((c) => c.awaitingReply)
    .sort((a, b) => a.lastIncomingAt - b.lastIncomingAt);
}

module.exports = { markIncoming, markReplied, getStatus, getAllPending };
