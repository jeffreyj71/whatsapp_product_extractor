const path = require('path');
const fs = require('fs');
const { add: addToBuffer, flushAll } = require('./bufferService');
const { isProductRelated, scoreMessage } = require('./nlpService');
const { extractText } = require('./ocrService');
const { extractBill } = require('./billExtractorService');
const { detectEvent } = require('./eventService');
const { addEvent } = require('./eventStore');
const { getFlags } = require('./featureFlags');
const { markIncoming } = require('./replyTracker');
const { appendTextRow, appendImageRow, appendBillRow, appendEventRow, getFilePath, getStats, init } = require('./excelService');
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

    // Flag this chat as "awaiting reply" immediately — don't wait for the buffer window
    markIncoming(chatId, senderName);
    broadcast('reply-status', { chatId, senderName, awaitingReply: true, lastIncomingAt: Date.now() });

    // Download media immediately if present (before buffer window closes)
    let mediaPath = null;
    let mimetype = null;
    let ocrText = null;
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

          // Run OCR on images only — skip video/audio/docs
          if (mimetype && mimetype.startsWith('image/')) {
            ocrText = await extractText(mediaPath);
            if (ocrText) {
              logger.info(`[OCR] Extracted ${ocrText.length} chars from image`);
            }

            // Bill Extractor — only runs when the sidebar toggle is on. Independent
            // of the normal Products/Images pipeline: a bill photo still goes through
            // that as usual, and ALSO gets a row here if extraction succeeds.
            if (getFlags().billExtractorEnabled) {
              const billFields = await extractBill(mediaPath);
              if (billFields) {
                const now = new Date();
                await appendBillRow({
                  sentBy: senderName,
                  number: senderId,
                  date:   now.toLocaleDateString('en-GB'),
                  time:   now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                  fields: billFields,
                });
                broadcast('bill-row', {
                  senderName, senderId,
                  fields: billFields,
                  timestamp: Date.now(),
                  stats: getStats(),
                  filePath: getFilePath(),
                });
                logger.info(`[BillExtractor] Extracted bill fields from ${senderName}`);
              }
            }
          }
        }
      } catch (err) {
        logger.warn(`Media download failed: ${err.message}`);
      }
    }

    // Event Reminders runs after OCR/bill handling, using the typed message and
    // any OCR result together. This lets a caption provide an event title for a
    // date found in an image (and vice versa).
    const eventText = [message.body || '', ocrText].filter(Boolean).join('\n').trim();
    if (eventText && getFlags().eventRemindersEnabled) {
      const detected = detectEvent(eventText);
      if (detected) {
        const event = addEvent({
          ...detected,
          sender: senderName,
          senderId,
        });
        await appendEventRow({
          sentBy: senderName,
          number: senderId,
          title: event.title,
          eventDate: event.date,
          sourceMessage: event.rawText,
        });
        broadcast('event-detected', {
          id: event.id,
          title: event.title,
          date: event.date,
          sender: event.sender,
          senderId: event.senderId,
          icsUrl: `/api/events/${event.id}/ics`,
        });
        logger.info(`[EventReminders] Detected event from ${senderName}: ${event.title}`);
      }
    }

    const item = {
      text:      message.body || '',
      ocrText,
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
    // Merge all typed text from the group
    const typedText = items.map((i) => i.text).filter(Boolean).join('\n').trim();
    // Merge all OCR-extracted text from any images in the group
    const ocrTexts = items.map((i) => i.ocrText).filter(Boolean);
    const ocrText = ocrTexts.join('\n').trim();
    // Combined text is what actually gets NLP-scored — a photo of a price list
    // should be flagged as product-related exactly like a typed message would be
    const combinedText = [typedText, ocrText].filter(Boolean).join('\n').trim();

    const textSource = typedText && ocrText ? 'typed+ocr' : (ocrText ? 'ocr' : (typedText ? 'typed' : null));

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
        text:       combinedText,
        textSource,
        mediaPath:  mediaPaths[0] || null,
        isProduct,
      });

      broadcast('row', {
        sheet: 1,
        senderName: first.senderName,
        senderId:   first.senderId,
        date, time,
        text:       combinedText,
        textSource,
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
