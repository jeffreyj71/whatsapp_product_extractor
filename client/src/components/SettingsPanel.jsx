import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';

export default function SettingsPanel({ onClose }) {
  const [nlpThreshold,    setNlpThreshold]    = useState(30);
  const [bufferWindowSec, setBufferWindowSec] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setNlpThreshold(s.nlpThreshold);
      setBufferWindowSec(s.bufferWindowSec);
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveSettings({ nlpThreshold, bufferWindowSec });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>Settings</h3>

        <label style={s.label}>
          NLP Threshold &nbsp;<span style={s.hint}>(0 – 100 · current: {nlpThreshold})</span>
          <input
            type="range" min={0} max={100} value={nlpThreshold}
            onChange={(e) => setNlpThreshold(Number(e.target.value))}
            style={s.slider}
          />
          <span style={s.desc}>Messages scoring at or above this value are flagged as product-related. Lower = more matches, higher = stricter.</span>
        </label>

        <label style={s.label}>
          Buffer window &nbsp;<span style={s.hint}>(seconds · current: {bufferWindowSec}s)</span>
          <input
            type="number" min={1} max={300} value={bufferWindowSec}
            onChange={(e) => setBufferWindowSec(Number(e.target.value))}
            style={s.numInput}
          />
          <span style={s.desc}>How long to wait before grouping a sender's messages together. Use 10s for testing, 60s for live use.</span>
        </label>

        <div style={s.actions}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 },
  modal:     { background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '28px 28px 20px', width: 420, display: 'flex', flexDirection: 'column', gap: 20 },
  title:     { margin: 0, fontSize: 17, fontWeight: 700, color: '#e6edf3' },
  label:     { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#e6edf3', fontWeight: 600 },
  hint:      { fontWeight: 400, color: '#8b949e' },
  slider:    { width: '100%', accentColor: '#25d366', cursor: 'pointer' },
  numInput:  { background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', padding: '6px 10px', fontSize: 14, width: 80 },
  desc:      { fontWeight: 400, fontSize: 11, color: '#8b949e', lineHeight: 1.5 },
  actions:   { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { background: 'transparent', border: '1px solid #30363d', color: '#8b949e', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 },
  saveBtn:   { background: '#25d366', border: 'none', color: '#000', borderRadius: 6, padding: '6px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
};
