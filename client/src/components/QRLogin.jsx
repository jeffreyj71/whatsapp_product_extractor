import React from 'react';

const STATUS_MESSAGES = {
  disconnected: 'Initializing WhatsApp client…',
  qr_ready:     'Scan the QR code with your phone',
  connecting:   'Connecting…',
  connected:    'Connected!',
  auth_failure: 'Authentication failed — restart the server.',
};

export default function QRLogin({ qrData, connectionStatus }) {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={s.title}>Link Your WhatsApp Account</h2>
        <p style={s.sub}>
          Open WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
        </p>
        <div style={s.qrBox}>
          {qrData
            ? <img src={qrData} alt="QR code" style={s.qrImg} />
            : <Spinner />}
        </div>
        <p style={s.statusText}>{STATUS_MESSAGES[connectionStatus] || connectionStatus}</p>
        <div style={s.notice}>
          <strong>Privacy:</strong> Your session is stored locally only. No data leaves your machine.
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div style={s.spinner} />;
}

const s = {
  wrap:       { display: 'flex', justifyContent: 'center', paddingTop: 60 },
  card:       { background: '#161b22', borderRadius: 12, padding: '32px 40px', border: '1px solid #30363d', maxWidth: 380, width: '100%', textAlign: 'center' },
  title:      { margin: '0 0 8px', fontSize: 20, fontWeight: 700 },
  sub:        { margin: '0 0 24px', color: '#8b949e', fontSize: 13, lineHeight: 1.6 },
  qrBox:      { width: 200, height: 200, margin: '0 auto 16px', background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  qrImg:      { width: '100%', height: '100%' },
  spinner:    { width: 40, height: 40, border: '4px solid #30363d', borderTop: '4px solid #25d366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  statusText: { color: '#8b949e', fontSize: 13, margin: '0 0 16px' },
  notice:     { background: '#0d1117', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#8b949e', border: '1px solid #30363d', textAlign: 'left' },
};

// Inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
  const el = document.createElement('style');
  el.id = 'spin-style';
  el.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(el);
}
