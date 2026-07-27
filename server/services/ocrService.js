const { createWorker, OEM } = require('tesseract.js');
const logger = require('../utils/logger');
require('dotenv').config();

// Below this confidence (Tesseract's own 0-100 score) we treat the result as noise
const MIN_CONFIDENCE = parseInt(process.env.OCR_MIN_CONFIDENCE || '40', 10);
// Below this many characters, it's not worth treating as "real" text
const MIN_CHARS = 3;

let workerPromise = null;

/**
 * Lazily create ONE worker and reuse it for every image.
 *
 * NOTE on engine choice: Tesseract's classic Legacy engine (OEM.TESSERACT_ONLY) was tested
 * against this project's real image types and produced unusable output even on clean,
 * computer-rendered text — it predates anti-aliased/variable fonts. We use the LSTM engine
 * instead: a small neural network that runs 100% locally in this process (no network calls,
 * no API key, no cloud service — the model file is downloaded once and cached on disk).
 * This is the one ML component in the project, kept because Legacy mode's output was not
 * usable for the stated goal (making image content searchable/scoreable).
 */
function getWorker() {
  if (!workerPromise) {
    logger.info('Starting OCR worker (local Tesseract LSTM engine, no network calls at runtime)…');
    workerPromise = createWorker('eng', OEM.LSTM_ONLY).then((worker) => {
      logger.info('OCR worker ready');
      return worker;
    }).catch((err) => {
      logger.error(`OCR worker failed to start: ${err.message}`);
      workerPromise = null; // allow retry on next call
      throw err;
    });
  }
  return workerPromise;
}

/**
 * Run OCR on an image file and return cleaned, usable text (or '' if nothing useful found).
 * Never throws — OCR failures should never take down message handling.
 * @param {string} imagePath - absolute path to a downloaded image file
 * @returns {Promise<string>}
 */
async function extractText(imagePath) {
  if (!imagePath) return '';
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imagePath);
    const text = (data.text || '').replace(/\s+/g, ' ').trim();

    if (text.length < MIN_CHARS) return '';
    if (data.confidence != null && data.confidence < MIN_CONFIDENCE) return '';

    return text;
  } catch (err) {
    logger.warn(`OCR failed for ${imagePath}: ${err.message}`);
    return '';
  }
}

async function shutdown() {
  if (workerPromise) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch { /* already dead, ignore */ }
  }
}

module.exports = { extractText, shutdown };
