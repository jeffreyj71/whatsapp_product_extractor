import React, { useState, useEffect } from 'react';
import { api, connectWebSocket } from './api/client.js';
import QRLogin from './components/QRLogin.jsx';
import ChatFilter from './components/ChatFilter.jsx';
import LiveFeed from './components/LiveFeed.jsx';
import ExcelPanel from './components/ExcelPanel.jsx';
import ResetDialog from './components/ResetDialog.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import MissedChatReport from './components/MissedChatReport.jsx';
import FeaturePlaceholder from './components/FeaturePlaceholder.jsx';
import EventReminders from './components/EventReminders.jsx';
import BusinessOpportunities from './components/BusinessOpportunities.jsx';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectedInfo, setConnectedInfo]       = useState(null);
  const [qrData, setQrData]                     = useState(null);
  const [rows, setRows]                         = useState([]);
  const [filePath, setFilePath]                 = useState(null);
  const [stats, setStats]                       = useState({ sheet1Rows: 0, sheet2Rows: 0, sheet3Rows: 0, sheet4Rows: 0 });
  const [showReset, setShowReset]               = useState(false);
  const [showSettings, setShowSettings]         = useState(false);
  const [activeView, setActiveView]             = useState('extractor');
  const [billEnabled, setBillEnabled]           = useState(false);
  const [eventEnabled, setEventEnabled]         = useState(false);
  const [oppEnabled, setOppEnabled]             = useState(false);
  const [pendingChats, setPendingChats]         = useState({});
  const [billRows, setBillRows]                 = useState([]);
  const [eventRows, setEventRows]               = useState([]);
  const [opportunityRows, setOpportunityRows]   = useState([]);
  const [eventNotifications, setEventNotifications] = useState([]);
  const [missedChatsViewedAt, setMissedChatsViewedAt] = useState(() => Number(localStorage.getItem('missedChatsViewedAt')) || 0);
  const [productEnabled, setProductEnabled] = useState(true);

  const pendingCount = Object.values(pendingChats).filter((c) => c.awaitingReply).length;
  const unseenMissedCount = Object.values(pendingChats).filter((c) => c.awaitingReply && c.lastIncomingAt > missedChatsViewedAt).length;

  function openView(view) {
    setActiveView(view);
    if (view === 'missed') {
      const viewedAt = Date.now();
      localStorage.setItem('missedChatsViewedAt', String(viewedAt));
      setMissedChatsViewedAt(viewedAt);
    }
  }

  function showEventNotification(event) {
    const notification = { id: `${event.id}-${event.reminderOffset}-${Date.now()}`, event };
    setEventNotifications((prev) => [...prev, notification]);
    window.setTimeout(() => setEventNotifications((prev) => prev.filter((item) => item.id !== notification.id)), 8000);
  }

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
    try {
      await api.reset('session');
    } catch (err) {
      console.error('Reset failed:', err.message);
    }
  }

  // Toggle handlers that actually persist to the backend — the raw setBillEnabled/
  // setOppEnabled setters are no longer passed down directly, since the server needs
  // to know the real state (listenerService checks this flag on every incoming image).
  async function toggleBillEnabled(next) {
    setBillEnabled(next); // optimistic UI update
    try {
      await api.setFeature('billExtractorEnabled', next);
    } catch (err) {
      console.error('Failed to update Bill Extractor toggle:', err.message);
      setBillEnabled(!next); // revert on failure
    }
  }

  async function toggleEventEnabled(next) {
    setEventEnabled(next);
    try {
      await api.setFeature('eventRemindersEnabled', next);
    } catch (err) {
      console.error('Failed to update Event Reminders toggle:', err.message);
      setEventEnabled(!next);
    }
  }

  async function toggleOppEnabled(next) {
    setOppEnabled(next);
    try {
      await api.setFeature('businessOpportunitiesEnabled', next);
    } catch (err) {
      console.error('Failed to update Business Opportunities toggle:', err.message);
      setOppEnabled(!next);
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
        setBillRows([]);
        setEventRows([]);
        if (data.filePath) setFilePath(data.filePath);
        if (data.stats)    setStats(data.stats);
      },
      'reply-status': (data) => {
        setPendingChats((prev) => ({
          ...prev,
          [data.chatId]: {
            ...prev[data.chatId],
            chatId: data.chatId,
            senderName: data.senderName || prev[data.chatId]?.senderName || data.chatId,
            lastIncomingAt: data.lastIncomingAt || prev[data.chatId]?.lastIncomingAt,
            awaitingReply: data.awaitingReply,
          },
        }));
      },
      'bill-row': (data) => {
        setBillRows((prev) => [...prev, data]);
        if (data.filePath) setFilePath(data.filePath);
        if (data.stats)    setStats(data.stats);
      },
      'event-detected': (data) => {
        setEventRows((prev) => [...prev, data]);
      },
      'event-reminder': showEventNotification,
      'business-opportunity': (data) => {
        setOpportunityRows((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
      },
    });

    api.getPending().then(({ pending }) => {
      const seed = {};
      pending.forEach((c) => { seed[c.chatId] = c; });
      setPendingChats(seed);
    }).catch(() => {});

    // Load the real, server-side toggle state on startup — without this, the
    // sidebar would always show "off" on page refresh even if it was left on.
    api.getFeatures().then((flags) => {
      setBillEnabled(!!flags.billExtractorEnabled);
      setEventEnabled(!!flags.eventRemindersEnabled);
      setOppEnabled(!!flags.businessOpportunitiesEnabled);
    }).catch(() => {});

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
        pendingCount={pendingCount}
      />

      {showReset    && <ResetDialog    onChoose={handleReset} onCancel={() => setShowReset(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {!isConnected ? (
        <QRLogin qrData={qrData} connectionStatus={connectionStatus} />
      ) : (
        <div style={s.body}>
          <Sidebar
            activeView={activeView}
            setActiveView={openView}
            pendingCount={unseenMissedCount}
            billEnabled={billEnabled}
            setBillEnabled={toggleBillEnabled}
            eventEnabled={eventEnabled}
            setEventEnabled={toggleEventEnabled}
            oppEnabled={oppEnabled}
            setOppEnabled={toggleOppEnabled}
          />
          <div style={s.viewArea}>
            {activeView === 'extractor' && (
              <>
                <ExcelPanel filePath={filePath} stats={stats} onReset={() => setShowReset(true)} />
                <div style={s.extractorBody}>
                  <aside style={s.chatSidebar}>
                    <ChatFilter />
                  </aside>
                  <main style={s.main}>
                    <LiveFeed rows={rows} />
                  </main>
                </div>
              </>
            )}
            {activeView === 'missed' && <MissedChatReport pendingChats={pendingChats} unseenSince={missedChatsViewedAt} />}
            {activeView === 'bill' && (
              <FeaturePlaceholder
                icon="🧾"
                title="Bill Extractor"
                enabled={billEnabled}
                description={
                  billEnabled
                    ? `Running — ${billRows.length} bill${billRows.length === 1 ? '' : 's'} extracted so far this session. Check the "Bills" sheet in your Excel file for full results.`
                    : "Will extract itemised bill/receipt details from incoming images and messages."
                }
              />
            )}
            {activeView === 'events' && (
              <EventReminders
                events={eventRows}
                onDemoReminder={showEventNotification}
              />
            )}
            {activeView === 'opportunities' && (
              <BusinessOpportunities opportunities={opportunityRows} enabled={oppEnabled} />
            )}
          </div>
        </div>
      )}

      <footer style={s.footer}>
        ⚠️ Only monitor chats you are authorised to access. All data stays on your local machine.
      </footer>
      <div style={s.toastArea} aria-live="polite">
        {eventNotifications.map(({ id, event }) => (
          <div key={id} style={s.toast}>📅 {event.title || 'Event'} starts in {event.reminderOffset} minutes.</div>
        ))}
      </div>
    </div>
  );
}

function Header({ status, info, onLogout, onSettings, pendingCount }) {
  const dot = { connected: '#25d366', qr_ready: '#f0a500', connecting: '#f0a500', disconnected: '#e53e3e', auth_failure: '#e53e3e' }[status] || '#888';
  const isConnected = status === 'connected';
  return (
    <header style={s.header}>
      <span style={s.logo}>📡 WhatsApp Product Listener</span>
      <div style={s.headerRight}>
        {pendingCount > 0 && (
          <span style={s.pendingPill}>🔴 {pendingCount} awaiting reply</span>
        )}
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
  pendingPill: { fontSize: 12, fontWeight: 600, color: '#f85149', background: '#2d1416', border: '1px solid #6e2020', borderRadius: 12, padding: '3px 10px' },
  toastArea: { position: 'fixed', right: 20, bottom: 20, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  toast: { background: '#1f2c22', color: '#e6edf3', border: '1px solid #25d366', borderRadius: 8, padding: '11px 14px', fontSize: 13, boxShadow: '0 6px 18px rgba(0,0,0,.35)' },
  dot:         { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  statusText:  { fontSize: 13, color: '#8b949e' },
  body:          { display: 'flex', flex: 1, overflow: 'hidden' },
  viewArea:      { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  extractorBody: { display: 'flex', flex: 1, overflow: 'hidden' },
  chatSidebar:   { width: 240, flexShrink: 0, borderRight: '1px solid #30363d', padding: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  main:          { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 },
  footer:      { textAlign: 'center', padding: '8px 16px', fontSize: 11, color: '#8b949e', borderTop: '1px solid #30363d', background: '#161b22', flexShrink: 0 },
  headerBtn:   { background: 'transparent', border: '1px solid #30363d', color: '#8b949e', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 },
  logoutBtn:   { borderColor: '#6e2020', color: '#f85149' },
};
