const fs = require('fs');

// Common install locations for Chrome/Edge on Windows. Either works with
// whatsapp-web.js since both are Chromium-based.
const CANDIDATES = [
  '%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe',
  '%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe',
  '%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe',
  '%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe',
];

function expandEnv(str) {
  return str.replace(/%([^%]+)%/g, (_, name) => process.env[name] || '');
}

// Returns the path to a locally installed Chrome/Edge, or null if neither
// is found — callers should fall back to Puppeteer's own managed browser.
function findLocalChrome() {
  for (const candidate of CANDIDATES) {
    const expanded = expandEnv(candidate);
    if (expanded && fs.existsSync(expanded)) return expanded;
  }
  return null;
}

module.exports = { findLocalChrome };
