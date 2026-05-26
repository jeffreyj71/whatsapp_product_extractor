const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

let client = null;
let currentQR = null;
let connectionStatus = 'disconnected';
let connectedInfo = null;
let storedOnMessage = null;
const wsClients = new Set();

function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  for (const ws of wsClients) {
    try { ws.send(payload); } catch {}
  }
}

function registerWsClient(ws) {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
  ws.send(JSON.stringify({ event: 'status', data: getStatus() }));
  if (currentQR) {
    ws.send(JSON.stringify({ event: 'qr', data: { qr: currentQR } }));
  }
}

function getStatus() {
  return { status: connectionStatus, info: connectedInfo };
}

function getClient() {
  return client;
}

async function initClient(onMessage) {
  if (client) return;
  storedOnMessage = onMessage;

  const sessionPath = path.resolve(process.env.SESSION_DATA_PATH || '.wwebjs_auth');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      protocolTimeout: 120000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qrString) => {
    connectionStatus = 'qr_ready';
    logger.info('QR code received — waiting for scan');
    try {
      currentQR = await qrcode.toDataURL(qrString);
      broadcast('qr', { qr: currentQR });
      broadcast('status', getStatus());
    } catch (err) {
      logger.error(`QR generation failed: ${err.message}`);
    }
  });

  client.on('loading_screen', (percent, message) => {
    if (connectionStatus === 'connected') return;
    connectionStatus = 'connecting';
    logger.info(`Loading WhatsApp: ${percent}% — ${message}`);
    broadcast('status', { status: 'connecting', percent, message });
  });

  client.on('authenticated', () => {
    currentQR = null;
    connectionStatus = 'connecting';
    broadcast('status', getStatus());
  });

  client.on('auth_failure', (msg) => {
    connectionStatus = 'auth_failure';
    logger.error(`Auth failure: ${msg}`);
    broadcast('status', getStatus());
  });

  client.on('ready', async () => {
    connectionStatus = 'connected';
    currentQR = null;
    try {
      const info = client.info;
      connectedInfo = {
        name: info.pushname || 'Unknown',
        phoneNumber: info.wid?.user || 'Unknown',
      };
    } catch {
      connectedInfo = {};
    }
    logger.info(`WhatsApp ready — connected as ${connectedInfo.name}`);
    broadcast('status', getStatus());
  });

  // Live message listener — fires for every incoming message
  client.on('message', async (message) => {
    if (onMessage) onMessage(message);
  });

  client.on('disconnected', (reason) => {
    connectionStatus = 'disconnected';
    connectedInfo = null;
    currentQR = null;
    logger.warn(`WhatsApp disconnected: ${reason}`);
    broadcast('status', getStatus());
    client = null;
    // Auto-restart so QR appears without needing a server restart
    setTimeout(() => initClient(storedOnMessage), 4000);
  });

  logger.info('Initializing WhatsApp client…');
  await client.initialize();
}

async function logoutClient() {
  if (!client) return;

  // Capture and null out immediately so nothing else touches the dead client
  const dying = client;
  client = null;
  connectionStatus = 'disconnected';
  connectedInfo = null;
  currentQR = null;
  broadcast('status', { status: 'disconnected', info: null });

  try {
    await dying.logout();
  } catch {
    try { await dying.destroy(); } catch {}
  }

  // Re-init to show QR screen again
  setTimeout(() => initClient(storedOnMessage), 4000);
}

module.exports = { initClient, logoutClient, getClient, getStatus, registerWsClient, broadcast };
