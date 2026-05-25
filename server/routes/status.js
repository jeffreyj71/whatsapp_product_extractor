const express = require('express');
const router = express.Router();
const { getStatus } = require('../whatsappClient');
const { getFilePath, getStats } = require('../services/excelService');

router.get('/status', (_req, res) => {
  res.json({
    ...getStatus(),
    filePath: getFilePath(),
    stats: getStats(),
  });
});

module.exports = router;
