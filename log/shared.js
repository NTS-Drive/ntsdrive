/* ===== Shared across log/write.html, log/index.html, log/mylogs.html ===== */

function navigate(url) {
  document.body.classList.add('leaving');
  setTimeout(() => { window.location.href = url; }, 260);
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('leaving');
});
document.body.addEventListener('animationend', function onDone(e) {
  if (e.animationName === 'pageIn') document.body.classList.add('anim-settled');
});

const LETTER_MAX_CHARS = 100;
const GOAL_MIN = 100;
const GOAL_MAX = 1000;

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function pad2(n) { return String(n).padStart(2, '0'); }
function toDatetimeLocalValue(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatDday(ms) {
  const d = new Date(ms);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} (${days[d.getDay()]}) ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* ===== UTF-8 safe, URL-safe base64 + 경량 XOR 난독화 (Post와 동일 방식) ===== */
const NTS_OBF_KEY = 'ntsdrive-2026-link-is-the-key';
function ntsXor(bytes) {
  const key = new TextEncoder().encode(NTS_OBF_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}
function encodeData(obj) {
  const json = JSON.stringify(obj);
  const bytes = ntsXor(new TextEncoder().encode(json));
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeData(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const json = new TextDecoder().decode(ntsXor(bytes));
  return JSON.parse(json);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== Extract an encoded token from a pasted URL or raw string ===== */
function extractParam(input, paramName) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.searchParams.get(paramName) || null;
  } catch (e) {
    const re = new RegExp(`[?&]${paramName}=([^&]+)`);
    const m = trimmed.match(re);
    if (m) return m[1];
    return trimmed.length > 20 ? trimmed : null; // last resort: assume raw token
  }
}

/* ===== GA4 helper (fails silently if gtag isn't loaded) ===== */
function trackEvent(name, params) {
  try {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  } catch (e) { /* no-op */ }
}
