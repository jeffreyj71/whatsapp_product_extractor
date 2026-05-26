const BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getStatus:    () => apiFetch('/status'),
  getChats:     () => apiFetch('/chats'),
  setFilter:    (ids) => apiFetch('/chats/filter', { method: 'POST', body: JSON.stringify({ ids }) }),
  reset:        (mode) => apiFetch('/reset', { method: 'POST', body: JSON.stringify({ mode }) }),
  logout:       () => apiFetch('/logout', { method: 'POST' }),
  getSettings:  () => apiFetch('/settings'),
  saveSettings: (data) => apiFetch('/settings', { method: 'POST', body: JSON.stringify(data) }),
};

export function connectWebSocket(handlers) {
  const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
  ws.onmessage = (event) => {
    try {
      const { event: name, data } = JSON.parse(event.data);
      handlers[name]?.(data);
    } catch {}
  };
  ws.onclose = () => handlers.close?.();
  ws.onerror = () => handlers.error?.();
  return { close: () => ws.close() };
}
