// Thin wrapper around the backend review API.
// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production, set VITE_API_BASE to the deployed backend URL.

const BASE = import.meta.env.VITE_API_BASE || '';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Review a single pasted/uploaded snippet.
export function reviewSnippet({ code, language, filename }) {
  return post('/api/review', { code, language, filename });
}

// Review code fetched from a GitHub repo / PR / file URL.
export function reviewGithub(url) {
  return post('/api/review/github', { url });
}
