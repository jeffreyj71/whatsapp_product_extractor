import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

function formatDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleString();
}

export default function EventReminders({ events = [] }) {
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState([]);

  useEffect(() => {
    api.getEvents().then(({ events: savedEvents }) => {
      setInitial(savedEvents || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const combined = new Map();
    [...initial, ...events].forEach((event) => combined.set(event.id, event));
    return [...combined.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [initial, events]);

  return (
    <div style={s.wrap}>
      <div style={s.headerRow}>
        <h2 style={s.title}>Event Reminders</h2>
        <span style={s.subtitle}>Dates and times detected in incoming messages.</span>
      </div>

      {loading ? (
        <p style={s.empty}>Loading…</p>
      ) : list.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 32 }}>📅</span>
          <p style={s.empty}>No events detected yet.</p>
        </div>
      ) : (
        <div style={s.list}>
          {list.map((event) => (
            <div key={event.id} style={s.row}>
              <div style={s.details}>
                <span style={s.eventTitle}>{event.title || 'Event'}</span>
                <span style={s.date}>{formatDate(event.date)}</span>
                <span style={s.sender}>from {event.sender || event.senderName || 'Unknown sender'}</span>
              </div>
              <a style={s.download} href={event.icsUrl || `/api/events/${event.id}/ics`}>
                Download .ics
              </a>
            </div>
          ))}
        </div>
      )}

      <p style={s.note}>Download a calendar file to add an event and its 30-minute reminder to your calendar.</p>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', flexDirection: 'column', gap: 16, padding: 4, height: '100%', overflow: 'hidden' },
  headerRow:  { display: 'flex', flexDirection: 'column', gap: 4 },
  title:      { margin: 0, fontSize: 20, color: '#e6edf3' },
  subtitle:   { fontSize: 13, color: '#8b949e' },
  list:       { display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', border: '1px solid #30363d', borderRadius: 8, padding: 8 },
  row:        { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#161b22', borderRadius: 6 },
  details:    { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
  eventTitle: { fontSize: 14, color: '#e6edf3', fontWeight: 600 },
  date:       { fontSize: 13, color: '#25d366' },
  sender:     { fontSize: 12, color: '#8b949e' },
  download:   { color: '#58a6ff', fontSize: 12, border: '1px solid #30363d', borderRadius: 5, padding: '5px 8px', textDecoration: 'none', whiteSpace: 'nowrap' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 0' },
  empty:      { color: '#8b949e', fontSize: 13, textAlign: 'center' },
  note:       { fontSize: 11, color: '#6e7681', marginTop: 'auto' },
};
