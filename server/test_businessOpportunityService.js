const assert = require('assert');
const { scoreMessage } = require('./services/businessOpportunityService');

const high = scoreMessage('Please send a quotation for a bulk order. What is your price and MOQ?');
assert.ok(high.score > 0, 'Positive business text should score above zero');
assert.ok(high.matchedKeywords.some((match) => match.keyword === 'quotation'));
assert.ok(high.matchedCategories.some((match) => match.category === 'highIntent'));

const negative = scoreMessage('Not interested, please stop sending spam.');
assert.strictEqual(negative.score, 0, 'Negative-only text should not surface');
assert.strictEqual(negative.tier, null);

console.log('Business opportunity scoring tests passed');
