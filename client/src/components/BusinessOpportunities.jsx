import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const PREVIEW_LENGTH = 180;

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

function tierStyle(tier) {
  return {
    High: { color: '#3fb950', background: '#14351f', borderColor: '#238636' },
    Medium: { color: '#f0a500', background: '#3d2e08', borderColor: '#9e6a03' },
    Low: { color: '#8b949e', background: '#21262d', borderColor: '#484f58' },
  }[tier] || {};
}

export default function BusinessOpportunities({ opportunities = [], enabled }) {
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.getOpportunities().then(({ opportunities: saved }) => {
      setInitial(saved || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const combined = new Map();
    [...opportunities, ...initial].forEach((opportunity) => combined.set(opportunity.id, opportunity));
    return [...combined.values()].sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
  }, [initial, opportunities]);

  if (!enabled) {
    return (
      <div style={s.wrap}>
        <div style={s.headerRow}>
          <h2 style={s.title}>Business Opportunities</h2>
          <span style={s.subtitle}>Scores incoming messages for follow-up potential.</span>
        </div>
        <div style={s.emptyState}>
          <span style={{ fontSize: 32 }}>💡</span>
          <p style={s.empty}>Turn on Business Opportunities in the sidebar to score new incoming messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.headerRow}>
        <h2 style={s.title}>Business Opportunities</h2>
        <span style={s.subtitle}>Keyword-scored messages worth following up on.</span>
      </div>

      {loading ? (
        <p style={s.empty}>Loading…</p>
      ) : list.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize: 32 }}>✅</span>
          <p style={s.empty}>No opportunities detected yet.</p>
        </div>
      ) : (
        <div style={s.list}>
          {list.map((opportunity) => {
            const isExpanded = expanded[opportunity.id];
            const isLong = opportunity.text.length > PREVIEW_LENGTH;
            const visibleText = isExpanded || !isLong
              ? opportunity.text
              : `${opportunity.text.slice(0, PREVIEW_LENGTH)}…`;
            return (
              <article key={opportunity.id} style={s.row}>
                <div style={s.rowHeader}>
                  <div style={s.senderBlock}>
                    <span style={s.sender}>{opportunity.sender || opportunity.senderId || 'Unknown sender'}</span>
                    <span style={s.timestamp}>{formatTimestamp(opportunity.timestamp)}</span>
                  </div>
                  <span style={{ ...s.badge, ...tierStyle(opportunity.tier) }}>
                    {opportunity.tier} · {opportunity.score}
                  </span>
                </div>
                <p style={s.message}>{visibleText}</p>
                {isLong && (
                  <button type="button" style={s.expandButton} onClick={() => setExpanded((prev) => ({ ...prev, [opportunity.id]: !isExpanded }))}>
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
                <div style={s.tags} aria-label="Matched keywords">
                  {(opportunity.matchedKeywords || []).map((match) => (
                    <span key={`${match.category}-${match.keyword}`} style={s.tag}>
                      {match.keyword}{match.count > 1 ? ` ×${match.count}` : ''}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p style={s.note}>Scores reflect editable local keyword rules; messages with a score of zero are not shown.</p>
    </div>
  );
}

const s = {
  wrap:         { display: 'flex', flexDirection: 'column', gap: 16, padding: 4, height: '100%', overflow: 'hidden' },
  headerRow:    { display: 'flex', flexDirection: 'column', gap: 4 },
  title:        { margin: 0, fontSize: 20, color: '#e6edf3' },
  subtitle:     { fontSize: 13, color: '#8b949e' },
  list:         { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', border: '1px solid #30363d', borderRadius: 8, padding: 8 },
  row:          { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: '#161b22', borderRadius: 6 },
  rowHeader:    { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  senderBlock:  { display: 'flex', flexDirection: 'column', gap: 2 },
  sender:       { color: '#e6edf3', fontSize: 14, fontWeight: 600 },
  timestamp:    { color: '#8b949e', fontSize: 11 },
  badge:        { border: '1px solid', borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  message:      { margin: 0, color: '#c9d1d9', fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  expandButton: { alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: '#58a6ff', cursor: 'pointer', fontSize: 12 },
  tags:         { display: 'flex', gap: 5, flexWrap: 'wrap' },
  tag:          { padding: '2px 6px', borderRadius: 999, background: '#21262d', color: '#8b949e', fontSize: 11 },
  emptyState:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 0' },
  empty:        { color: '#8b949e', fontSize: 13, textAlign: 'center' },
  note:         { fontSize: 11, color: '#6e7681', marginTop: 'auto' },
};
