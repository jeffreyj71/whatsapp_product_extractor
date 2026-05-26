import React from 'react';

export default function ExcelPanel({ filePath, stats, onReset }) {
  const sheet1 = stats?.sheet1Rows ?? 0;
  const sheet2 = stats?.sheet2Rows ?? 0;

  return (
    <div style={s.wrap}>
      <div style={s.stat}>
        <span style={s.statVal}>{sheet1}</span>
        <span style={s.statLabel}>Product rows</span>
      </div>
      <div style={s.stat}>
        <span style={s.statVal}>{sheet2}</span>
        <span style={s.statLabel}>Image-only rows</span>
      </div>
      <div style={s.fileBox}>
        <span style={s.fileLabel}>Excel file:</span>
        <code style={s.filePath}>{filePath || 'Initialising…'}</code>
      </div>
      <button style={s.resetBtn} onClick={onReset}>Reset</button>
    </div>
  );
}

const s = {
  wrap:      { display: 'flex', alignItems: 'center', gap: 20, padding: '10px 20px', background: '#161b22', borderBottom: '1px solid #30363d', flexWrap: 'wrap' },
  stat:      { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 },
  statVal:   { fontSize: 22, fontWeight: 800, color: '#25d366' },
  statLabel: { fontSize: 11, color: '#8b949e' },
  fileBox:   { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  fileLabel: { fontSize: 12, color: '#8b949e', whiteSpace: 'nowrap' },
  filePath:  { fontSize: 12, color: '#79c0ff', background: '#0d1117', padding: '4px 10px', borderRadius: 4, wordBreak: 'break-all' },
  resetBtn:  { marginLeft: 'auto', background: 'transparent', border: '1px solid #6e2020', color: '#f85149', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, flexShrink: 0 },
};
