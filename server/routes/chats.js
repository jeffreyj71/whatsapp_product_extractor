const express = require('express');
const router = express.Router();
const { getClient, getStatus } = require('../whatsappClient');
const { setSelectedChats, getSelectedChats } = require('../services/listenerService');
const logger = require('../utils/logger');

// GET /api/chats — list all chats
router.get('/chats', async (_req, res) => {
  const { status } = getStatus();
  if (status !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected', status });
  }
  try {
    const chats = await getClient().getChats();
    const simplified = chats.map((c) => ({
      id: c.id._serialized,
      name: c.name || c.id.user,
      isGroup: c.isGroup,
      lastMessageTimestamp: c.timestamp || null,
    })).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    res.json({ chats: simplified, selected: getSelectedChats() });
  } catch (err) {
    logger.error(`getChats failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/filter — update which chats are monitored
// Body: { ids: string[] }  — empty array = monitor all
router.post('/chats/filter', (req, res) => {
  const { ids } = req.body;
  setSelectedChats(ids);
  logger.info(`Chat filter updated: ${ids?.length ? ids.length + ' chats' : 'all chats'}`);
  res.json({ ok: true, selected: getSelectedChats() });
});

module.exports = router;
