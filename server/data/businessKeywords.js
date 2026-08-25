// Editable B2B opportunity signals. Tune these terms and weights as real
// customer messages reveal the language that matters most to the business.
const KEYWORD_CATEGORIES = {
  highIntent: {
    weight: 3,
    keywords: ['order', 'quotation', 'quote', 'bulk order', 'wholesale', 'purchase', 'invoice', 'payment', 'deal', 'contract', 'partnership', 'collaborate', 'supplier', 'distributor'],
  },
  mediumIntent: {
    weight: 2,
    keywords: ['price', 'pricing', 'cost', 'rate', 'discount', 'availability', 'stock', 'sample', 'catalogue', 'catalog', 'MOQ', 'delivery', 'shipping'],
  },
  lowIntent: {
    weight: 1,
    keywords: ['interested', 'details', 'more info', 'call me', 'meeting', 'demo', 'proposal'],
  },
  negativeSignals: {
    weight: -2,
    keywords: ['not interested', 'no thanks', 'spam', 'unsubscribe', 'wrong number', 'stop'],
  },
};

module.exports = { KEYWORD_CATEGORIES };
