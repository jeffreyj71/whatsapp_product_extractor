import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

function formatDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleString();
}

export default function EventReminders({ events = [], onDemoReminder }) {
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
    [...events, ...initial].forEach((event) => combined.set(event.id, event));
    return [...combined.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [initial, events]);

  async function toggleReminder(event, offset) {
    const current = event.reminderOffsets || [30];
    const reminderOffsets = current.includes(offset)
      ? current.filter((value) => value !== offset)
      : [...current, offset];
    try {
      const { event: saved } = await api.saveEventReminders(event.id, reminderOffsets);
      setInitial((prev) => [...prev.filter((item) => item.id !== saved.id), saved]);
    } catch (err) {
      console.error('Could not save event reminders:', err.message);
    }
  }

  function triggerDemoReminder() {
    // Keep this payload shaped exactly like the event-reminder WebSocket event.
    onDemoReminder?.({
      id: 'demo-event-reminder',
      title: "Let's have a meeting regarding event discussion",
      date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      sender: 'Nisha',
      reminderOffset: 30,
      reminderOffsets: [30],
    });
  }

  return (
    <div style={s.wrap}>
      <div style={s.headerRow}>
        <h2 style={s.title}>Event Reminders</h2>
        <span style={s.subtitle}>Dates and times detected in incoming messages.</span>
      </div>

      {/* DEMO ONLY — remove before production */}
      {import.meta.env.DEV && (
        <div style={s.demoArea}>
          <button type="button" style={s.demoButton} onClick={triggerDemoReminder}>
            🔔 Test Notification
          </button>
          <span style={s.demoHint}>Shows the production reminder toast with sample event data.</span>
        </div>
      )}

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
                <span style={s.reminders}>
                  {[60, 30, 15].map((offset) => (
                    <label key={offset} style={s.reminderOption}>
                      <input
                        type="checkbox"
                        checked={(event.reminderOffsets || [30]).includes(offset)}
                        onChange={() => toggleReminder(event, offset)}
                      />
                      {offset === 60 ? '1 hour' : `${offset} min`}
                    </label>
                  ))}
                </span>
              </div>
              <a style={s.download} href={event.icsUrl || `/api/events/${event.id}/ics`} aria-label={`Add ${event.title || 'event'} to calendar`}>
                Add to Calendar
              </a>
            </div>
          ))}
        </div>
      )}

      <p style={s.note}>Choose one or more local reminders, then add the same event and reminders to your calendar with the ICS file.</p>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', flexDirection: 'column', gap: 16, padding: 4, height: '100%', overflow: 'hidden' },
  headerRow:  { display: 'flex', flexDirection: 'column', gap: 4 },
  title:      { margin: 0, fontSize: 20, color: '#e6edf3' },
  subtitle:   { fontSize: 13, color: '#8b949e' },
  demoArea:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px dashed #6e7681', borderRadius: 8, background: '#161b22' },
  demoButton: { padding: '6px 10px', border: '1px solid #58a6ff', borderRadius: 5, background: 'transparent', color: '#58a6ff', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' },
  demoHint:   { color: '#8b949e', fontSize: 11 },
  list:       { display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', border: '1px solid #30363d', borderRadius: 8, padding: 8 },
  row:        { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#161b22', borderRadius: 6 },
  details:    { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
  eventTitle: { fontSize: 14, color: '#e6edf3', fontWeight: 600 },
  date:       { fontSize: 13, color: '#25d366' },
  sender:     { fontSize: 12, color: '#8b949e' },
  reminders:  { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 3 },
  reminderOption: { fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' },
  download:   { color: '#58a6ff', fontSize: 12, border: '1px solid #30363d', borderRadius: 5, padding: '5px 8px', textDecoration: 'none', whiteSpace: 'nowrap' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 0' },
  empty:      { color: '#8b949e', fontSize: 13, textAlign: 'center' },
  note:       { fontSize: 11, color: '#6e7681', marginTop: 'auto' },
};
