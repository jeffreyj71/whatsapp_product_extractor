const { createWorker, OEM, PSM } = require('tesseract.js');
const sharp = require('sharp');
const logger = require('../utils/logger');
require('dotenv').config();

const MIN_CONFIDENCE = parseInt(process.env.OCR_MIN_CONFIDENCE || '40', 10);
const MIN_CHARS = 3;

let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    logger.info('Starting OCR worker (local Tesseract LSTM engine, no network calls at runtime)…');
    workerPromise = createWorker('eng', OEM.LSTM_ONLY).then(async (worker) => {
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      logger.info('OCR worker ready (PSM: sparse text)');
      return worker;
    }).catch((err) => {
      logger.error(`OCR worker failed to start: ${err.message}`);
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

async function preprocess(imagePath) {
  try {
    return await sharp(imagePath)
      .resize({ width: 2000, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  } catch (err) {
    logger.warn(`OCR preprocessing failed, using original image: ${err.message}`);
    return imagePath;
  }
}

async function extractText(imagePath) {
  if (!imagePath) return '';
  try {
    const worker = await getWorker();
    const processedImage = await preprocess(imagePath);
    const { data } = await worker.recognize(processedImage);
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
    } catch { /* already dead */ }
  }
}

module.exports = { extractText, shutdown };