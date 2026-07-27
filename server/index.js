require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const logger = require('./utils/logger');
const { initClient, registerWsClient } = require('./whatsappClient');
const { handleMessage, init: initExcel } = require('./services/listenerService');

const statusRouter   = require('./routes/status');
const chatsRouter    = require('./routes/chats');
const resetRouter    = require('./routes/reset');
const logoutRouter   = require('./routes/logout');
const settingsRouter = require('./routes/settings');
const pendingRouter  = require('./routes/pending');
const featuresRouter = require('./routes/features');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', statusRouter);
app.use('/api', chatsRouter);
app.use('/api', resetRouter);
app.use('/api', featuresRouter);
app.use('/api', logoutRouter);
app.use('/api', settingsRouter);
app.use('/api', pendingRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve downloaded media files so the browser can display them
const MEDIA_TMP = require('path').resolve('output', 'tmp_media');
app.use('/media', express.static(MEDIA_TMP));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  logger.info('Browser WebSocket connected');
  registerWsClient(ws);
});

server.listen(PORT, async () => {
  logger.info(`Server listening on http://localhost:${PORT}`);

  // Initialise Excel file before WhatsApp connects
  await initExcel();

  // Start WhatsApp — pass the live message handler
  initClient(handleMessage).catch((err) =>
    logger.error(`WhatsApp init error: ${err.message}`)
  );
});

// Catch EBUSY errors from WhatsApp session cleanup on Windows — safe to ignore
process.on('uncaughtException', (err) => {
  if (err.message?.includes('EBUSY') || err.message?.includes('detached Frame')) {
    logger.warn(`WhatsApp cleanup error (safe to ignore): ${err.message}`);
    return;
  }
  logger.error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const { shutdown } = require('./services/listenerService');
  const { shutdown: shutdownOcr } = require('./services/ocrService');
  shutdown();
  shutdownOcr().finally(() => process.exit(0));
});
