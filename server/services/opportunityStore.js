const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const STORE_PATH = path.resolve(process.env.OUTPUT_PATH || 'output', 'opportunities.json');
let opportunities = loadOpportunities();

function loadOpportunities() {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const saved = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    logger.warn(`Could not load saved business opportunities: ${err.message}`);
    return [];
  }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(opportunities, null, 2));
  } catch (err) {
    logger.warn(`Could not save business opportunities: ${err.message}`);
  }
}

function addOpportunity(opportunity) {
  const stored = {
    id: randomUUID(),
    text: opportunity.text || '',
    sender: opportunity.sender || '',
    senderId: opportunity.senderId || '',
    timestamp: Number(opportunity.timestamp) || Date.now(),
    score: Number(opportunity.score) || 0,
    tier: opportunity.tier || null,
    matchedKeywords: opportunity.matchedKeywords || [],
    matchedCategories: opportunity.matchedCategories || [],
  };
  opportunities.push(stored);
  persist();
  return stored;
}

function getAllOpportunities() {
  return [...opportunities].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
}

module.exports = { addOpportunity, getAllOpportunities };
