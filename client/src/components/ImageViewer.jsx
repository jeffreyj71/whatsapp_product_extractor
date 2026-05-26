import React, { useEffect, useState } from 'react';

export default function ImageViewer({ urls, onClose }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, urls.length - 1));
      if (e.key === 'ArrowLeft')  setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [urls, onClose]);

  const SERVER = `${window.location.protocol}//${window.location.hostname}:3001`;

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <img
          src={`${SERVER}${urls[index]}`}
          alt={`media ${index + 1}`}
          style={s.img}
        />

        {urls.length > 1 && (
          <div style={s.nav}>
            <button style={s.arrow} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>‹</button>
            <span style={s.counter}>{index + 1} / {urls.length}</span>
            <button style={s.arrow} disabled={index === urls.length - 1} onClick={() => setIndex((i) => i + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:    { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: '90vw', maxHeight: '90vh' },
  close:    { position: 'absolute', top: -36, right: 0, background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 },
  img:      { maxWidth: '85vw', maxHeight: '78vh', borderRadius: 6, objectFit: 'contain' },
  nav:      { display: 'flex', alignItems: 'center', gap: 16 },
  arrow:    { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', borderRadius: 4, padding: '2px 12px', lineHeight: 1, disabled: { opacity: 0.3 } },
  counter:  { color: '#ccc', fontSize: 14 },
};
