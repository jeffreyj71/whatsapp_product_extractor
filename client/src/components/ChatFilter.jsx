import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';

export default function ChatFilter({ onFilterChange }) {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [allSelected, setAllSelected] = useState(true);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChats().then(({ chats }) => {
      setChats(chats);
      // Default: all selected
      setSelected(new Set(chats.map((c) => c.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? chats.filter((c) => c.name.toLowerCase().includes(q)) : chats;
  }, [chats, search]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllSelected(next.size === chats.length);
    pushFilter(next);
  };

  const selectAll = () => {
    const next = new Set(chats.map((c) => c.id));
    setSelected(next);
    setAllSelected(true);
    pushFilter(next);
  };

  const deselectAll = () => {
    setSelected(new Set());
    setAllSelected(false);
    pushFilter(new Set());
  };

  const pushFilter = (ids) => {
    const arr = [...ids];
    // Empty array = monitor all (pass null-like signal); full = all; partial = filtered
    api.setFilter(arr.length === chats.length ? [] : arr);
    onFilterChange?.(arr);
  };

  if (loading) return <div style={s.loading}>Loading chats…</div>;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Monitored Chats</span>
        <div style={s.actions}>
          <button style={s.actionBtn} onClick={selectAll}>All</button>
          <button style={s.actionBtn} onClick={deselectAll}>None</button>
        </div>
      </div>
      <input
        style={s.search}
        placeholder="Search chats…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div style={s.list}>
        {filtered.map((chat) => (
          <label key={chat.id} style={s.item}>
            <input
              type="checkbox"
              checked={selected.has(chat.id)}
              onChange={() => toggle(chat.id)}
              style={{ accentColor: '#25d366' }}
            />
            <span style={s.icon}>{chat.isGroup ? '👥' : '👤'}</span>
            <span style={s.name}>{chat.name}</span>
          </label>
        ))}
      </div>
      <p style={s.count}>{selected.size} / {chats.length} selected</p>
    </div>
  );
}

const s = {
  wrap:      { display: 'flex', flexDirection: 'column', gap: 8, height: '100%' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:     { fontWeight: 600, fontSize: 14 },
  actions:   { display: 'flex', gap: 6 },
  actionBtn: { background: '#21262d', border: '1px solid #30363d', color: '#8b949e', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', fontSize: 12 },
  search:    { padding: '6px 10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13, outline: 'none' },
  list:      { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #30363d', borderRadius: 6, padding: 6 },
  item:      { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  icon:      { fontSize: 14 },
  name:      { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  count:     { fontSize: 11, color: '#8b949e', margin: 0, textAlign: 'right' },
  loading:   { color: '#8b949e', fontSize: 13, padding: 8 },
};
