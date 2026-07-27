import React from 'react';

export default function FeaturePlaceholder({ icon, title, enabled, description }) {
  return (
    <div style={s.wrap}>
      <span style={{ fontSize: 40 }}>{icon}</span>
      <h2 style={s.title}>{title}</h2>
      {enabled ? (
        <>
          <p style={s.text}>{description}</p>
          <p style={s.soon}>This feature is turned on but not built yet — coming soon.</p>
        </>
      ) : (
        <p style={s.text}>
          This feature is currently turned off. Use the toggle next to
          <strong> {title} </strong>
          in the sidebar to turn it on.
        </p>
      )}
    </div>
  );
}

const s = {
  wrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, textAlign: 'center', padding: 24 },
  title: { margin: 0, fontSize: 20, color: '#e6edf3' },
  text:  { fontSize: 14, color: '#8b949e', maxWidth: 420 },
  soon:  { fontSize: 12, color: '#f0a500' },
};
