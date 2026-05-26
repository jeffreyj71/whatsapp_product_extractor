# WhatsApp Product Listener

A local tool that listens to incoming WhatsApp messages in real time, groups them by sender, scores them using NLP keyword matching, and exports them to a two-sheet Excel file.

---

## Privacy

> **This tool is for your own WhatsApp account only.**
> Only monitor chats you are authorised to access.
> All data stays on your local machine — nothing is uploaded anywhere.

---

## Features

- QR code login with persistent session (scan once, stays logged in)
- Live feed of all incoming messages as they arrive
- 60-second sender buffer — messages from the same person within the window are grouped together
- NLP keyword scoring (0–100) to detect product-related messages
- Two-sheet Excel export:
  - **Sheet 1 — Products:** all text messages with NLP score and Is Product flag
  - **Sheet 2 — Images Only:** image-only messages with embedded thumbnails
- Chat filter — monitor all chats or select specific ones
- Image viewer — click the image icon in the live feed to view full-size
- Reset button — clear the page, or wipe the session Excel and images
- Settings panel — adjust NLP threshold and buffer window live (no restart needed)
- Logout button — clears the session and shows QR screen again

---

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- A WhatsApp account

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/jeffreyj71/whatsapp_product_extractor.git
cd whatsapp_product_extractor
```

### 2. Copy environment config

```bash
cp .env.example .env
```

### 3. Install dependencies

```bash
npm install
cd client && npm install && cd ..
```

---

## Running

```bash
npm run dev
```

Or separately:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run client
```

Open **http://localhost:5173** in your browser.

---

## Usage

1. Open the app — scan the QR code with your phone (WhatsApp → Linked Devices → Link a Device).
2. Once connected, the live feed starts automatically.
3. Use the **Chat Filter** sidebar to choose which chats to monitor (default: all).
4. Messages are grouped per sender over a 60-second window, then flushed to Excel.
5. The Excel file path is shown at the top of the page.
6. Click the 🖼️ icon in the live feed to view images.
7. Use **Reset** to clear the page or the full session data.
8. Use **Settings** (⚙️) to adjust NLP threshold and buffer window without restarting.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `SESSION_DATA_PATH` | `.wwebjs_auth` | WhatsApp session folder |
| `OUTPUT_PATH` | `output` | Excel and media output folder |
| `LOG_LEVEL` | `info` | Logging level |
| `NLP_THRESHOLD` | `30` | Minimum NLP score to flag as product-related |
| `BUFFER_WINDOW_SECONDS` | `60` | Seconds to wait before grouping a sender's messages |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/status` | Connection status and phone info |
| GET | `/api/chats` | List all chats |
| POST | `/api/chats/filter` | Set which chats to monitor |
| GET | `/api/settings` | Get current NLP threshold and buffer window |
| POST | `/api/settings` | Update settings live |
| POST | `/api/reset` | Clear page or full session data |
| POST | `/api/logout` | Log out and return to QR screen |

WebSocket: `ws://localhost:3001` — streams `qr`, `status`, `row`, and `reset` events.

---

## Troubleshooting

**QR not showing:** Restart the server. Puppeteer may still be initialising.

**"Couldn't link device" on phone:** WhatsApp rate-limits failed attempts. Wait 5–10 minutes then try again.

**Session expired:** Click Logout in the app, or delete the `.wwebjs_auth` folder and restart the server.

**Chat list times out:** This can happen with a large number of chats. The timeout is set to 120 seconds — if it still fails, restart the server.
