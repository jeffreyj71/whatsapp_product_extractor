const express = require('express');
const fs = require('fs');
const path = require('path');
const { reset: resetExcel, getFilePath, getStats } = require('../services/excelService');
const { broadcast } = require('../whatsappClient');
const logger = require('../utils/logger');

const router = express.Router();

const MEDIA_TMP = path.resolve('output', 'tmp_media');

router.post('/reset', async (req, res) => {
  const { mode } = req.body;

  if (mode === 'page') {
    return res.json({ ok: true });
  }

  if (mode === 'session') {
    try {
      // Delete all temp media files
      if (fs.existsSync(MEDIA_TMP)) {
        for (const file of fs.readdirSync(MEDIA_TMP)) {
          try { fs.unlinkSync(path.join(MEDIA_TMP, file)); } catch {}
        }
      }

      // Reset Excel (deletes old file, creates fresh one)
      await resetExcel();

      const stats = getStats();
      const filePath = getFilePath();

      // Notify all browser clients
      broadcast('reset', { stats, filePath });

      return res.json({ ok: true, stats, filePath });
    } catch (err) {
      logger.error(`Reset error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({ error: 'mode must be "page" or "session"' });
});

module.exports = router;
