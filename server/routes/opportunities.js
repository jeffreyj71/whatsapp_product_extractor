const express = require('express');
const { getAllOpportunities } = require('../services/opportunityStore');

const router = express.Router();

router.get('/opportunities', (_req, res) => {
  res.json({ opportunities: getAllOpportunities() });
});

module.exports = router;
