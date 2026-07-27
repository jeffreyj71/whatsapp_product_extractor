const express = require('express');
const router = express.Router();
const { getFlags, setFlag } = require('../services/featureFlags');

router.get('/features', (_req, res) => {
  res.json(getFlags());
});

router.post('/features', (req, res) => {
  const { name, enabled } = req.body;
  const ok = setFlag(name, enabled);
  if (!ok) return res.status(400).json({ error: `Unknown feature: ${name}` });
  res.json(getFlags());
});

module.exports = router;