import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';

function timeAgo(ts) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MissedChatReport({ pendingChats }) {
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState([]);

  useEffect(() => {
    api.getPending().then(({ pending }) => {
      setInitial(pending);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const list = Object.keys(pendingChats).length > 0
    ? Object.values(pendingChats).filter((c) => c.awaitingReply)
    : initial;

  const sorted = [...list].sort((a, b) => a.lastIncomingAt - b.lastIncomingAt);

  return (
    <div style={s.wrap}>
      <div style={s.headerRow}>
        <h2 style={s.title}>Missed Chats</h2>
        <span style={s.subtitle}>
          Chats that sent a message which hasn&apos;t been replied to yet.
        </span>
      </div>

      {loading ? (
        <p style={s.empty}>Loading…</p>
      ) : sorted.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 32 }}>✅</span>
          <p style={s.empty}>Nothing pending — every chat has been replied to.</p>
        </div>
      ) : (
        <div style={s.list}>
          {sorted.map((c) => (
            <div key={c.chatId} style={s.row}>
              <span style={s.dot} />
              <span style={s.name}>{c.senderName || c.chatId}</span>
              <span style={s.time}>waiting {timeAgo(c.lastIncomingAt)}</span>
            </div>
          ))}
        </div>
      )}

      <p style={s.note}>
        This list resets when the server restarts — it reflects unanswered chats since the app was last started, not a permanent history.
      </p>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', flexDirection: 'column', gap: 16, padding: 4, height: '100%', overflow: 'hidden' },
  headerRow:  { display: 'flex', flexDirection: 'column', gap: 4 },
  title:      { margin: 0, fontSize: 20, color: '#e6edf3' },
  subtitle:   { fontSize: 13, color: '#8b949e' },
  list:       { display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', border: '1px solid #30363d', borderRadius: 8, padding: 8 },
  row:        { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#161b22', borderRadius: 6 },
  dot:        { width: 9, height: 9, borderRadius: '50%', background: '#e53e3e', flexShrink: 0 },
  name:       { flex: 1, fontSize: 14, color: '#e6edf3', fontWeight: 600 },
  time:       { fontSize: 12, color: '#8b949e' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 0' },
  empty:      { color: '#8b949e', fontSize: 13, textAlign: 'center' },
  note:       { fontSize: 11, color: '#6e7681', marginTop: 'auto' },
};
