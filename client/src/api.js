// Thin wrapper around the backend review + auth API.
// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production, set VITE_API_BASE to the deployed backend URL.

const BASE = import.meta.env.VITE_API_BASE || '';

const TOKEN_KEY = 'acr_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// ---- Reviews ----
export function reviewSnippet({ code, language, filename, source }) {
  return request('/api/review', { method: 'POST', body: { code, language, filename, source } });
}
export function reviewGithub(url) {
  return request('/api/review/github', { method: 'POST', body: { url } });
}

// ---- Auth ----
export function register({ name, email, password }) {
  return request('/api/auth/register', { method: 'POST', body: { name, email, password } });
}
export function login({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}
export function getMe() {
  return request('/api/auth/me');
}

// ---- Review history ----
export function listReviews() {
  return request('/api/reviews');
}
export function getReview(id) {
  return request(`/api/reviews/${id}`);
}
export function deleteReview(id) {
  return request(`/api/reviews/${id}`, { method: 'DELETE' });
}

// ---- Misc ----
export function health() {
  return request('/api/health');
}
