require('dotenv').config();

let threshold = parseInt(process.env.NLP_THRESHOLD || '30', 10);

// Keyword lists with weights
const PRICE_PATTERNS = [
  /rm\s*\d+/i, /myr\s*\d+/i, /\$\s*\d+/,
  /\d+\.\d{2}/, /price/i, /harga/i, /cost/i,
  /rate/i, /per\s+\w+/i,
];

const QUANTITY_KEYWORDS = [
  'kg', 'g', 'gram', 'pcs', 'piece', 'pieces', 'unit', 'units',
  'box', 'boxes', 'carton', 'cartons', 'dozen', 'pack', 'packs',
  'bag', 'bags', 'bottle', 'bottles', 'tin', 'tins', 'set', 'sets',
  'roll', 'rolls', 'litre', 'liter', 'ml', 'dozen',
];

const ACTION_KEYWORDS = [
  'available', 'stock', 'offer', 'sell', 'selling', 'jual', 'dijual',
  'ready', 'wholesale', 'retail', 'order', 'buy', 'sale', 'promo',
  'discount', 'diskaun', 'murah', 'cheap', 'new', 'baru', 'fresh',
  'instock', 'in stock', 'cod', 'delivery', 'hantar',
];

const PRODUCT_KEYWORDS = [
  'product', 'item', 'goods', 'material', 'brand', 'model',
  'size', 'colour', 'color', 'specification', 'spec', 'type',
  'quality', 'grade', 'category',
];

function scoreMessage(text) {
  if (!text || typeof text !== 'string') return 0;
  const lower = text.toLowerCase();
  let score = 0;

  // Price patterns carry the most weight
  for (const pattern of PRICE_PATTERNS) {
    if (pattern.test(lower)) { score += 25; break; }
  }

  // Quantity keywords
  for (const kw of QUANTITY_KEYWORDS) {
    if (lower.includes(kw)) { score += 15; break; }
  }

  // Action keywords
  for (const kw of ACTION_KEYWORDS) {
    if (lower.includes(kw)) { score += 15; break; }
  }

  // Product descriptor keywords
  for (const kw of PRODUCT_KEYWORDS) {
    if (lower.includes(kw)) { score += 10; break; }
  }

  // Bonus: contains numbers (prices, quantities)
  if (/\d+/.test(lower)) score += 10;

  // Bonus: multiple lines (often structured product info)
  if ((text.match(/\n/g) || []).length >= 2) score += 15;

  return Math.min(score, 100);
}

function isProductRelated(text) {
  return scoreMessage(text) >= threshold;
}

function getThreshold() { return threshold; }
function setThreshold(val) { threshold = Math.max(0, Math.min(100, parseInt(val, 10))); }

module.exports = { scoreMessage, isProductRelated, getThreshold, setThreshold };
