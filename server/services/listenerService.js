const path = require('path');
const fs = require('fs');
const { add: addToBuffer, flushAll } = require('./bufferService');
const { isProductRelated, scoreMessage } = require('./nlpService');
const { appendTextRow, appendImageRow, getFilePath, getStats, init } = require('./excelService');
const { broadcast } = require('../whatsappClient');
const logger = require('../utils/logger');
require('dotenv').config();

const MEDIA_TMP = path.resolve('output', 'tmp_media');

// Set of chat IDs currently being monitored. null = monitor all.
let selectedChatIds = null;

function setSelectedChats(ids) {
  selectedChatIds = ids && ids.length > 0 ? new Set(ids) : null;
}

function getSelectedChats() {
  return selectedChatIds ? [...selectedChatIds] : null;
}

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_TMP)) fs.mkdirSync(MEDIA_TMP, { recursive: true });
}

/**
 * Called by whatsappClient for every incoming message.
 */
async function handleMessage(message) {
  try {
    const chatId = message.from;

    // Skip outgoing messages sent from this device
    if (message.fromMe) return;

    // Skip system/broadcast and WhatsApp internal senders
    if (chatId === 'status@broadcast') return;
    if (message.author === '0@c.us' || chatId === '0@c.us') return;

    // Filter by selected chats
    if (selectedChatIds && !selectedChatIds.has(chatId)) return;

    const contact = await message.getContact();
    const senderId = contact.id?.user || message.author || chatId;
    const senderName = contact.pushname || contact.name || senderId;

    // Download media immediately if present (before buffer window closes)
    let mediaPath = null;
    let mimetype = null;
    if (message.hasMedia) {
      ensureMediaDir();
      try {
        const media = await message.downloadMedia();
        if (media && media.data) {
          mimetype = media.mimetype;
          const ext = (media.mimetype || '').split('/')[1]?.split(';')[0] || 'bin';
          const filename = `${message.id.id}.${ext}`;
          mediaPath = path.join(MEDIA_TMP, filename);
          fs.writeFileSync(mediaPath, Buffer.from(media.data, 'base64'));
        }
      } catch (err) {
        logger.warn(`Media download failed: ${err.message}`);
      }
    }

    const item = {
      text:      message.body || '',
      mediaPath,
      mimetype,
      timestamp: message.timestamp,
      senderName,
      senderId,
    };

    addToBuffer(chatId, senderId, item, onFlush);
  } catch (err) {
    logger.error(`handleMessage error: ${err.message}`);
  }
}

/**
 * Called when the 60-second buffer for a sender flushes.
 */
async function onFlush(chatId, senderId, items) {
  try {
    // Merge all text from the group
    const combinedText = items.map((i) => i.text).filter(Boolean).join('\n').trim();
    // Collect all media paths
    const mediaPaths = items.map((i) => i.mediaPath).filter(Boolean);
    const mimetypes  = items.map((i) => i.mimetype).filter(Boolean);

    const first = items[0];
    const ts = new Date(first.timestamp * 1000);
    const date = ts.toLocaleDateString('en-GB');
    const time = ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const rowBase = {
      sentBy: first.senderName,
      number: first.senderId,
      date,
      time,
    };

    const hasText  = combinedText.length > 0;
    const hasMedia = mediaPaths.length > 0;

    if (hasText) {
      // Text message (with or without image) → Sheet 1
      const nlpScore = scoreMessage(combinedText);
      const isProduct = isProductRelated(combinedText);
      logger.info(`[Sheet1] ${first.senderName}: NLP score=${nlpScore} product=${isProduct}`);

      await appendTextRow({
        ...rowBase,
        text:      combinedText,
        mediaPath: mediaPaths[0] || null,
        isProduct,
      });

      broadcast('row', {
        sheet: 1,
        senderName: first.senderName,
        senderId:   first.senderId,
        date, time,
        text:       combinedText,
        hasImage:   hasMedia,
        mediaUrls:  mediaPaths.map((p) => `/media/${path.basename(p)}`),
        nlpScore,
        isProduct,
        stats:      getStats(),
        filePath:   getFilePath(),
      });
    } else if (hasMedia) {
      // Image-only → Sheet 2 (one row per image)
      for (let i = 0; i < mediaPaths.length; i++) {
        logger.info(`[Sheet2] ${first.senderName}: image-only row`);
        await appendImageRow({
          ...rowBase,
          mediaPath: mediaPaths[i],
          mimetype:  mimetypes[i],
        });

        broadcast('row', {
          sheet: 2,
          senderName: first.senderName,
          senderId:   first.senderId,
          date, time,
          hasImage:   true,
          mediaUrls:  [`/media/${path.basename(mediaPaths[i])}`],
          isProduct:  false,
          stats:      getStats(),
          filePath:   getFilePath(),
        });
      }
    }
  } catch (err) {
    logger.error(`onFlush error: ${err.message}`);
  }
}

function shutdown() {
  flushAll(onFlush);
}

module.exports = { handleMessage, setSelectedChats, getSelectedChats, shutdown, init };
