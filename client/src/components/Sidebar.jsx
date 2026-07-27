import React from 'react';

const NAV_ITEMS = [
  { key: 'extractor',     label: 'Product Extractor',    icon: '📦', toggleable: true },
  { key: 'missed',        label: 'Missed Chats',   icon: '⏰', toggleable: false },
  { key: 'bill',          label: 'Bill Extractor',       icon: '🧾', toggleable: true },
  { key: 'opportunities', label: 'Business Opportunities', icon: '💡', toggleable: true },
];

export default function Sidebar({
  activeView, setActiveView,
  pendingCount,
  productEnabled, setProductEnabled,
  billEnabled, setBillEnabled,
  oppEnabled, setOppEnabled,
}) {
  const toggleState = {
    extractor: [productEnabled, setProductEnabled],
    bill: [billEnabled, setBillEnabled],
    opportunities: [oppEnabled, setOppEnabled],
  };

  return (
    <nav style={s.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeView === item.key;
        const [enabled, setEnabled] = toggleState[item.key] || [true, null];
        const isLocked = item.toggleable && !enabled;

        return (
          <div key={item.key} style={{ ...s.item, ...(isActive ? s.itemActive : {}) }}>
            <button
              style={s.itemBtn}
              onClick={() => setActiveView(item.key)}
              title={isLocked ? `${item.label} (turned off)` : item.label}
            >
              <span style={s.icon}>{item.icon}</span>
              <span style={{ ...s.label, ...(isLocked ? s.labelLocked : {}) }}>{item.label}</span>
              {item.key === 'missed' && pendingCount > 0 && (
                <span style={s.badge}>{pendingCount}</span>
              )}
            </button>

            {item.toggleable && (
              <button
                style={{ ...s.toggle, ...(enabled ? s.toggleOn : s.toggleOff) }}
                onClick={() => setEnabled(!enabled)}
                title={enabled ? 'Turn off' : 'Turn on'}
              >
                <span style={{ ...s.toggleKnob, ...(enabled ? s.toggleKnobOn : {}) }} />
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

const s = {
  nav:          { boxSizing: 'border-box', width: 220, flexShrink: 0, borderRight: '1px solid #30363d', background: '#0d1117', display: 'flex', flexDirection: 'column', padding: '10px 8px', gap: 2 },
  item:         { boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', borderRadius: 8, gap: 4, paddingRight: 4 },
  itemActive:   { background: '#1f2c22' },
  itemBtn:      { boxSizing: 'border-box', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#e6edf3', padding: '9px 6px', cursor: 'pointer', fontSize: 13.5, textAlign: 'left', borderRadius: 8 },
  icon:         { fontSize: 16, width: 18, textAlign: 'center', flexShrink: 0 },
  label:        { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  labelLocked:  { color: '#6e7681' },
  badge:        { background: '#e53e3e', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px', flexShrink: 0 },
  toggle:       { boxSizing: 'border-box', width: 30, height: 17, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2, display: 'flex', alignItems: 'center' },
  toggleOn:     { background: '#25d366' },
  toggleOff:    { background: '#30363d' },
  toggleKnob:   { width: 13, height: 13, borderRadius: '50%', background: '#fff', transition: 'transform 0.15s', transform: 'translateX(0px)' },
  toggleKnobOn: { transform: 'translateX(13px)' },
};