const express = require('express');
const { logoutClient } = require('../whatsappClient');

const router = express.Router();

router.post('/logout', async (req, res) => {
  await logoutClient();
  res.json({ ok: true });
});

module.exports = router;
