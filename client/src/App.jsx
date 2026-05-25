import React, { useState, useEffect } from 'react';
import { api, connectWebSocket } from './api/client.js';
import QRLogin from './components/QRLogin.jsx';
import ChatFilter from './components/ChatFilter.jsx';
import LiveFeed from './components/LiveFeed.jsx';
import ExcelPanel from './components/ExcelPanel.jsx';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectedInfo, setConnectedInfo]       = useState(null);
  const [qrData, setQrData]                     = useState(null);
  const [rows, setRows]                         = useState([]);
  const [filePath, setFilePath]                 = useState(null);
  const [stats, setStats]                       = useState({ sheet1Rows: 0, sheet2Rows: 0 });

  const isConnected = connectionStatus === 'connected';

  useEffect(() => {
    const ws = connectWebSocket({
      status: (data) => {
        setConnectionStatus(data.status);
        setConnectedInfo(data.info || null);
        if (data.status === 'connected') setQrData(null);
        if (data.filePath) setFilePath(data.filePath);
        if (data.stats)    setStats(data.stats);
      },
      qr: (data) => {
        setQrData(data.qr);
        setConnectionStatus('qr_ready');
      },
      row: (data) => {
        setRows((prev) => [...prev, data]);
        if (data.filePath) setFilePath(data.filePath);
        if (data.stats)    setStats(data.stats);
      },
    });

    api.getStatus().then((s) => {
      setConnectionStatus(s.status);
      setConnectedInfo(s.info || null);
      if (s.filePath) setFilePath(s.filePath);
      if (s.stats)    setStats(s.stats);
    }).catch(() => {});

    return () => ws.close();
  }, []);

  return (
    <div style={s.root}>
      <Header status={connectionStatus} info={connectedInfo} />

      {!isConnected ? (
        <QRLogin qrData={qrData} connectionStatus={connectionStatus} />
      ) : (
        <>
          <ExcelPanel filePath={filePath} stats={stats} />
          <div style={s.body}>
            <aside style={s.sidebar}>
              <ChatFilter />
            </aside>
            <main style={s.main}>
              <LiveFeed rows={rows} />
            </main>
          </div>
        </>
      )}

      <footer style={s.footer}>
        ⚠️ Only monitor chats you are authorised to access. All data stays on your local machine.
      </footer>
    </div>
  );
}

function Header({ status, info }) {
  const dot = { connected: '#25d366', qr_ready: '#f0a500', connecting: '#f0a500', disconnected: '#e53e3e', auth_failure: '#e53e3e' }[status] || '#888';
  return (
    <header style={s.header}>
      <span style={s.logo}>📡 WhatsApp Product Listener</span>
      <div style={s.headerRight}>
        <span style={{ ...s.dot, background: dot }} />
        <span style={s.statusText}>
          {status === 'connected' && info
            ? `${info.name} (+${info.phoneNumber})`
            : status.replace('_', ' ')}
        </span>
      </div>
    </header>
  );
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 },
  logo:        { fontSize: 16, fontWeight: 700, color: '#25d366' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  dot:         { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  statusText:  { fontSize: 13, color: '#8b949e' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:     { width: 240, flexShrink: 0, borderRight: '1px solid #30363d', padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 },
  footer:      { textAlign: 'center', padding: '8px 16px', fontSize: 11, color: '#8b949e', borderTop: '1px solid #30363d', background: '#161b22', flexShrink: 0 },
};
