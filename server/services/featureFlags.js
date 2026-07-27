// Simple in-memory feature flags — resets on server restart, same as replyTracker.
let flags = {
  billExtractorEnabled: false,
  businessOpportunitiesEnabled: false,
};

function getFlags() {
  return { ...flags };
}

function setFlag(name, value) {
  if (!(name in flags)) return false;
  flags[name] = !!value;
  return true;
}

module.exports = { getFlags, setFlag };