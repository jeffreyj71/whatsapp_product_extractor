const { KEYWORD_CATEGORIES } = require('../data/businessKeywords');

const MAX_HITS_PER_CATEGORY = 3;
const MAX_POSITIVE_RAW_SCORE = Object.values(KEYWORD_CATEGORIES)
  .filter((category) => category.weight > 0)
  .reduce((total, category) => total + category.weight * MAX_HITS_PER_CATEGORY, 0);

const SCORE_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  LOW: 1,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countKeywordHits(text, keyword) {
  // Word boundaries prevent "rate" from matching unrelated words such as "separate".
  const pattern = escapeRegExp(keyword).replace(/\s+/g, '\\s+');
  const matches = text.match(new RegExp(`\\b${pattern}\\b`, 'gi'));
  return matches ? matches.length : 0;
}

function getRelevanceTier(score) {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'High';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'Medium';
  if (score >= SCORE_THRESHOLDS.LOW) return 'Low';
  return null;
}

function scoreMessage(text) {
  const source = String(text || '').trim();
  if (!source) return { score: 0, rawScore: 0, tier: null, matchedKeywords: [], matchedCategories: [] };

  let rawScore = 0;
  const matchedKeywords = [];
  const matchedCategories = [];

  Object.entries(KEYWORD_CATEGORIES).forEach(([categoryName, category]) => {
    const hits = [];
    category.keywords.forEach((keyword) => {
      const count = countKeywordHits(source, keyword);
      if (count) hits.push({ keyword, count });
    });

    const hitCount = hits.reduce((total, hit) => total + hit.count, 0);
    if (!hitCount) return;

    const countedHits = Math.min(hitCount, MAX_HITS_PER_CATEGORY);
    const contribution = countedHits * category.weight;
    rawScore += contribution;
    matchedCategories.push({ category: categoryName, weight: category.weight, hitCount, countedHits, contribution });
    hits.forEach(({ keyword, count }) => matchedKeywords.push({ keyword, category: categoryName, count }));
  });

  // Negative signals can fully suppress a weak positive message, but the UI
  // always receives a simple 0–100 relevance score.
  const score = Math.max(0, Math.min(100, Math.round((rawScore / MAX_POSITIVE_RAW_SCORE) * 100)));
  return { score, rawScore, tier: getRelevanceTier(score), matchedKeywords, matchedCategories };
}

module.exports = { MAX_HITS_PER_CATEGORY, SCORE_THRESHOLDS, getRelevanceTier, scoreMessage };
