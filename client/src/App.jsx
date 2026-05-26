import React, { useState, useEffect } from 'react';
import { api, connectWebSocket } from './api/client.js';
import QRLogin from './components/QRLogin.jsx';
import ChatFilter from './components/ChatFilter.jsx';
import LiveFeed from './components/LiveFeed.jsx';
import ExcelPanel from './components/ExcelPanel.jsx';
import ResetDialog from './components/ResetDialog.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectedInfo, setConnectedInfo]       = useState(null);
  const [qrData, setQrData]                     = useState(null);
  const [rows, setRows]                         = useState([]);
  const [filePath, setFilePath]                 = useState(null);
  const [stats, setStats]                       = useState({ sheet1Rows: 0, sheet2Rows: 0 });
  const [showReset, setShowReset]               = useState(false);
  const [showSettings, setShowSettings]         = useState(false);

  const isConnected = connectionStatus === 'connected';

  async function handleLogout() {
    try { await api.logout(); } catch (err) { console.error('Logout error:', err.message); }
  }

  async function handleReset(mode) {
    setShowReset(false);
    if (mode === 'page') {
      setRows([]);
      return;
    }
    // session — server clears files and broadcasts reset event
    try {
      await api.reset('session');
    } catch (err) {
      console.error('Reset failed:', err.message);
    }
  }

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
      reset: (data) => {
        setRows([]);
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
      <Header
        status={connectionStatus}
        info={connectedInfo}
        onLogout={handleLogout}
        onSettings={() => setShowSettings(true)}
      />

      {showReset    && <ResetDialog    onChoose={handleReset} onCancel={() => setShowReset(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {!isConnected ? (
        <QRLogin qrData={qrData} connectionStatus={connectionStatus} />
      ) : (
        <>
          <ExcelPanel filePath={filePath} stats={stats} onReset={() => setShowReset(true)} />
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

function Header({ status, info, onLogout, onSettings }) {
  const dot = { connected: '#25d366', qr_ready: '#f0a500', connecting: '#f0a500', disconnected: '#e53e3e', auth_failure: '#e53e3e' }[status] || '#888';
  const isConnected = status === 'connected';
  return (
    <header style={s.header}>
      <span style={s.logo}>📡 WhatsApp Product Listener</span>
      <div style={s.headerRight}>
        <span style={{ ...s.dot, background: dot }} />
        <span style={s.statusText}>
          {isConnected && info
            ? `${info.name} (+${info.phoneNumber})`
            : status.replace('_', ' ')}
        </span>
        <button style={s.headerBtn} onClick={onSettings} title="Settings">⚙️</button>
        {isConnected && (
          <button style={{ ...s.headerBtn, ...s.logoutBtn }} onClick={onLogout} title="Log out of WhatsApp">
            Log out
          </button>
        )}
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
  headerBtn:   { background: 'transparent', border: '1px solid #30363d', color: '#8b949e', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 },
  logoutBtn:   { borderColor: '#6e2020', color: '#f85149' },
};
