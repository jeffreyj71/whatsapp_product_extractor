require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const logger = require('./utils/logger');
const { initClient, registerWsClient } = require('./whatsappClient');
const { handleMessage, init: initExcel } = require('./services/listenerService');

const statusRouter = require('./routes/status');
const chatsRouter = require('./routes/chats');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', statusRouter);
app.use('/api', chatsRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));

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

// Graceful shutdown
process.on('SIGINT', () => {
  const { shutdown } = require('./services/listenerService');
  shutdown();
  process.exit(0);
});
