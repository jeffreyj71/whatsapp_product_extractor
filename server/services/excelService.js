const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
require('dotenv').config();

const OUTPUT_BASE = path.resolve(process.env.OUTPUT_PATH || 'output');

let workbook = null;
let sheet1 = null; // Text / product messages
let sheet2 = null; // Image-only messages
let sheet3 = null; // Bills
let sheet4 = null; // Events
let filePath = null;
let sno1 = 1;
let sno2 = 1;
let sno3 = 1;
let sno4 = 1;

const SHEET1_HEADERS = ['S.No', 'Sent By', 'Number', 'Date', 'Time', 'Text', 'Has Image'];
const SHEET2_HEADERS = ['S.No', 'Sent By', 'Number', 'Date', 'Time', 'Image'];
const SHEET3_HEADERS = ['S.No', 'Sent By', 'Number', 'Date', 'Time', 'Extracted Fields'];

const ROW_HEIGHT = 80; // px height for image rows
const IMG_WIDTH  = 100;
const IMG_HEIGHT = 70;

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_BASE)) fs.mkdirSync(OUTPUT_BASE, { recursive: true });
}

function buildFilePath() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  return path.join(OUTPUT_BASE, `products_${stamp}.xlsx`);
}

async function init() {
  ensureOutputDir();
  filePath = buildFilePath();

  workbook = new ExcelJS.Workbook();
  workbook.creator = 'WhatsApp Product Listener';
  workbook.created = new Date();

  // Sheet 1 — text/product messages
  sheet1 = workbook.addWorksheet('Products');
  sheet1.columns = [
    { header: 'S.No',        key: 'sno',        width: 6 },
    { header: 'Sent By',     key: 'sentBy',     width: 20 },
    { header: 'Number',      key: 'number',     width: 18 },
    { header: 'Date',        key: 'date',       width: 14 },
    { header: 'Time',        key: 'time',       width: 10 },
    { header: 'Text',        key: 'text',       width: 60 },
    { header: 'Text Source', key: 'textSource', width: 14 },
    { header: 'Has Image',   key: 'hasImage',   width: 12 },
    { header: 'Is Product',  key: 'isProduct',  width: 12 },
  ];
  styleHeader(sheet1);

  // Sheet 2 — image-only messages
  sheet2 = workbook.addWorksheet('Images Only');
  sheet2.columns = [
    { header: 'S.No',    key: 'sno',    width: 6 },
    { header: 'Sent By', key: 'sentBy', width: 20 },
    { header: 'Number',  key: 'number', width: 18 },
    { header: 'Date',    key: 'date',   width: 14 },
    { header: 'Time',    key: 'time',   width: 10 },
    { header: 'Image',   key: 'image',  width: 18 },
  ];
  styleHeader(sheet2);

  // Sheet 3 — bills
  sheet3 = workbook.addWorksheet('Bills');
  sheet3.columns = [
    { header: 'S.No',   key: 'sno',    width: 6 },
    { header: 'Sent By', key: 'sentBy', width: 20 },
    { header: 'Number', key: 'number', width: 18 },
    { header: 'Date',   key: 'date',   width: 14 },
    { header: 'Time',   key: 'time',   width: 10 },
    { header: 'Extracted Fields', key: 'fields', width: 70 },
  ];
  styleHeader(sheet3);

  // Sheet 4 — detected event reminders
  sheet4 = workbook.addWorksheet('Events');
  sheet4.columns = [
    { header: 'S.No',            key: 'sno',           width: 6 },
    { header: 'Sent By',         key: 'sentBy',        width: 20 },
    { header: 'Number',          key: 'number',        width: 18 },
    { header: 'Detected Title',  key: 'title',          width: 35 },
    { header: 'Event Date',      key: 'eventDate',      width: 24 },
    { header: 'Source Message',  key: 'sourceMessage',  width: 70 },
  ];
  styleHeader(sheet4);

  await save();
  logger.info(`Excel file initialised: ${filePath}`);
}

function styleHeader(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF075E54' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;
}

/**
 * Append a row to Sheet 1 (text message, optionally with an image).
 * @param {{ sentBy, number, date, time, text, mediaPath? }} data
 */
async function appendTextRow(data) {
  if (!sheet1) await init();

  const row = sheet1.addRow({
    sno:        sno1++,
    sentBy:     data.sentBy || '',
    number:     data.number || '',
    date:       data.date || '',
    time:       data.time || '',
    text:       data.text || '',
    textSource: data.textSource || 'typed',
    hasImage:   data.mediaPath ? 'Yes' : 'No',
    isProduct:  data.isProduct ? 'Yes' : 'No',
  });
  row.alignment = { wrapText: true, vertical: 'middle' };

  await save();
}

/**
 * Append a row to Sheet 2 (image-only message) with the image embedded.
 * @param {{ sentBy, number, date, time, mediaPath, mimetype }} data
 */
async function appendImageRow(data) {
  if (!sheet2) await init();

  const rowIndex = sno2 + 1; // +1 for header row
  const row = sheet2.addRow({
    sno:    sno2++,
    sentBy: data.sentBy || '',
    number: data.number || '',
    date:   data.date || '',
    time:   data.time || '',
    image:  '',
  });
  row.height = ROW_HEIGHT;
  row.alignment = { vertical: 'middle' };

  // Embed image if file exists and is an image type
  if (data.mediaPath && fs.existsSync(data.mediaPath)) {
    const ext = getImageExtension(data.mimetype);
    if (ext) {
      try {
        const imageId = workbook.addImage({
          filename: data.mediaPath,
          extension: ext,
        });
        // Position image over the "Image" column (col 6, index 5)
        sheet2.addImage(imageId, {
          tl: { col: 5, row: rowIndex - 1 },
          ext: { width: IMG_WIDTH, height: IMG_HEIGHT },
        });
      } catch (err) {
        logger.warn(`Image embed failed: ${err.message}`);
        row.getCell('image').value = 'embed failed';
      }
    } else {
      row.getCell('image').value = path.basename(data.mediaPath);
    }
  } else {
    row.getCell('image').value = 'unavailable';
  }

  await save();
}

/**
 * Append a row to Sheet 3 (structured bill/receipt extraction result).
 * @param {{ sentBy, number, date, time, fields }} data
 */
async function appendBillRow(data) {
  if (!sheet3) await init();

  const row = sheet3.addRow({
    sno:    sno3++,
    sentBy: data.sentBy || '',
    number: data.number || '',
    date:   data.date || '',
    time:   data.time || '',
    fields: JSON.stringify(data.fields || {}, null, 0),
  });
  row.alignment = { wrapText: true, vertical: 'middle' };

  await save();
}

/**
 * Append a row to Sheet 4 (detected event reminder).
 * @param {{ sentBy, number, title, eventDate, sourceMessage }} data
 */
async function appendEventRow(data) {
  if (!sheet4) await init();

  const row = sheet4.addRow({
    sno:           sno4++,
    sentBy:        data.sentBy || '',
    number:        data.number || '',
    title:         data.title || 'Event',
    eventDate:     data.eventDate instanceof Date
      ? data.eventDate.toLocaleString('en-GB')
      : (data.eventDate || ''),
    sourceMessage: data.sourceMessage || '',
  });
  row.alignment = { wrapText: true, vertical: 'middle' };

  await save();
}

function getImageExtension(mimetype) {
  const map = {
    'image/jpeg': 'jpeg',
    'image/jpg':  'jpeg',
    'image/png':  'png',
    'image/gif':  'gif',
    'image/webp': 'png', // exceljs doesn't support webp — caller should convert or skip
  };
  return map[mimetype?.toLowerCase()] || null;
}

async function save() {
  if (!workbook || !filePath) return;
  try {
    await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    logger.error(`Excel save failed: ${err.message}`);
  }
}

function getFilePath() { return filePath; }
function getStats() {
  return { sheet1Rows: sno1 - 1, sheet2Rows: sno2 - 1, sheet3Rows: sno3 - 1, sheet4Rows: sno4 - 1 };
}

async function reset() {
  // Delete the current file if it exists
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (err) { logger.warn(`Could not delete Excel: ${err.message}`); }
  }
  // Reset state
  workbook = null; sheet1 = null; sheet2 = null; sheet3 = null; sheet4 = null; filePath = null;
  sno1 = 1; sno2 = 1; sno3 = 1; sno4 = 1;
  // Create a fresh file
  await init();
}

module.exports = { init, appendTextRow, appendImageRow, appendBillRow, appendEventRow, getFilePath, getStats, reset };
