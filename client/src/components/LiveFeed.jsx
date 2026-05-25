import React, { useRef, useEffect } from 'react';

export default function LiveFeed({ rows }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows.length]);

  if (rows.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyText}>Listening for messages…</p>
        <p style={s.emptyHint}>Rows will appear here as messages are processed (after the 60-second grouping window).</p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['#', 'Sheet', 'Sent By', 'Number', 'Date', 'Time', 'Text', 'Image', 'NLP Score'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ ...s.tr, background: row.sheet === 2 ? '#1a1f2e' : 'transparent' }}>
                <td style={s.td}>{i + 1}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: row.sheet === 1 ? '#1a3c2a' : '#1a2a3c', color: row.sheet === 1 ? '#25d366' : '#58a6ff' }}>
                    {row.sheet === 1 ? 'Products' : 'Images'}
                  </span>
                </td>
                <td style={s.td}>{row.senderName}</td>
                <td style={s.td}>{row.senderId}</td>
                <td style={s.td}>{row.date}</td>
                <td style={s.td}>{row.time}</td>
                <td style={{ ...s.td, maxWidth: 300 }}>{row.text || '—'}</td>
                <td style={s.td}>{row.hasImage ? '🖼️' : '—'}</td>
                <td style={s.td}>
                  {row.nlpScore != null
                    ? <NlpBadge score={row.nlpScore} />
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function NlpBadge({ score }) {
  const color = score >= 60 ? '#25d366' : score >= 30 ? '#f0a500' : '#8b949e';
  return <span style={{ color, fontWeight: 600 }}>{score}</span>;
}

const s = {
  wrap:      { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  tableWrap: { overflowY: 'auto', flex: 1, border: '1px solid #30363d', borderRadius: 8 },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '10px 12px', background: '#161b22', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #30363d', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
  tr:        { borderBottom: '1px solid #21262d' },
  td:        { padding: '8px 12px', verticalAlign: 'top', wordBreak: 'break-word' },
  badge:     { fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, padding: 40 },
  emptyText: { fontSize: 16, color: '#8b949e', margin: 0 },
  emptyHint: { fontSize: 13, color: '#484f58', margin: 0, textAlign: 'center', maxWidth: 360 },
};
