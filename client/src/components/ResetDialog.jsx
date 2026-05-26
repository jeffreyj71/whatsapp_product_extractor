import React from 'react';

export default function ResetDialog({ onChoose, onCancel }) {
  return (
    <div style={s.backdrop} onClick={onCancel}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>Clear data</h3>
        <p style={s.subtitle}>What would you like to clear?</p>

        <div style={s.options}>
          <button style={s.optBtn} onClick={() => onChoose('page')}>
            <span style={s.optIcon}>🖥️</span>
            <span style={s.optLabel}>Page only</span>
            <span style={s.optDesc}>Clears the live feed on screen. The Excel file and saved images are kept.</span>
          </button>

          <button style={{ ...s.optBtn, ...s.optBtnDanger }} onClick={() => onChoose('session')}>
            <span style={s.optIcon}>🗑️</span>
            <span style={s.optLabel}>Current session</span>
            <span style={s.optDesc}>Deletes the Excel file and all saved images for this session, then starts fresh.</span>
          </button>
        </div>

        <button style={s.cancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const s = {
  backdrop:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 },
  modal:        { background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '28px 28px 20px', width: 420, display: 'flex', flexDirection: 'column', gap: 16 },
  title:        { margin: 0, fontSize: 17, fontWeight: 700, color: '#e6edf3' },
  subtitle:     { margin: 0, fontSize: 13, color: '#8b949e' },
  options:      { display: 'flex', flexDirection: 'column', gap: 10 },
  optBtn:       { display: 'flex', flexDirection: 'column', gap: 4, background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' },
  optBtnDanger: { borderColor: '#6e2020' },
  optIcon:      { fontSize: 20 },
  optLabel:     { fontSize: 14, fontWeight: 600, color: '#e6edf3' },
  optDesc:      { fontSize: 12, color: '#8b949e', lineHeight: 1.5 },
  cancel:       { alignSelf: 'flex-end', background: 'transparent', border: '1px solid #30363d', color: '#8b949e', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 },
};
