const fs = require('fs');
const FormData = require('form-data');
const logger = require('../utils/logger');
require('dotenv').config();

const BILL_SERVICE_URL = process.env.BILL_SERVICE_URL || 'http://localhost:8000';

/**
 * Calls the Python LayoutLMv3 microservice. Never throws — if the Python
 * service is down, slow, or errors, this just returns null and the message
 * still gets processed normally (falls back to whatever OCR/image handling
 * already happens), same fail-safe pattern as ocrService.js.
 */
async function extractBill(imagePath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const res = await fetch(`${BILL_SERVICE_URL}/extract-bill`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      signal: AbortSignal.timeout(15000), // don't hang the message pipeline forever
    });

    if (!res.ok) throw new Error(`Bill service returned ${res.status}`);
    const { fields } = await res.json();
    return fields || null;
  } catch (err) {
    logger.warn(`Bill extraction failed: ${err.message}`);
    return null;
  }
}

module.exports = { extractBill };