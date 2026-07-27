const express = require('express');
const router = express.Router();
const { getAllPending } = require('../services/replyTracker');

// GET /api/pending — chats that received a message with no reply sent yet,
// oldest-unanswered first. Powers the "Missed Chat Report" view.
router.get('/pending', (_req, res) => {
  res.json({ pending: getAllPending() });
});

module.exports = router;
