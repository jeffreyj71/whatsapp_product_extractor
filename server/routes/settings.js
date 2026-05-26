const express = require('express');
const { getThreshold, setThreshold } = require('../services/nlpService');
const { getWindowSeconds, setWindowSeconds } = require('../services/bufferService');

const router = express.Router();

router.get('/settings', (req, res) => {
  res.json({
    nlpThreshold:    getThreshold(),
    bufferWindowSec: getWindowSeconds(),
  });
});

router.post('/settings', (req, res) => {
  const { nlpThreshold, bufferWindowSec } = req.body;
  if (nlpThreshold    != null) setThreshold(nlpThreshold);
  if (bufferWindowSec != null) setWindowSeconds(bufferWindowSec);
  res.json({
    nlpThreshold:    getThreshold(),
    bufferWindowSec: getWindowSeconds(),
  });
});

module.exports = router;
