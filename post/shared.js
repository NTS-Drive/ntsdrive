/* ===== Shared across post/index.html (compose/locked/reveal) and post/inbox.html ===== */

function navigate(url) {
  document.body.classList.add('leaving');
  setTimeout(() => { window.location.href = url; }, 260);
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('leaving');
});

  // Fix: body's pageIn animation animates `transform`, and with fill-mode:both that computed transform lingers after the animation completes — which makes body a containing block for any position:fixed descendant (bottom nav, floating buttons), anchoring them to the full page height instead of the viewport. Strip the animation once it's done so body goes back to a normal (untransformed) containing block.
  document.body.addEventListener('animationend', function onDone(e) {
    if (e.animationName === 'pageIn') document.body.classList.add('anim-settled');
  });

const MAX_CHARS = 300;
const MAX_PHOTO_MB = 8;
const IMG_GRID = 48;

const TEMPLATES = [
  { id: 'celebrate', emoji: '🎉', label: '축하 편지', example: '축하해! 오늘 하루는 아무 생각하지 말고 즐겨!' },
  { id: 'cheer',     emoji: '💪', label: '응원 편지', example: '너는 결국 해낼 사람이야.' },
  { id: 'confess',   emoji: '💌', label: '고백 편지', example: '사실 예전부터 하고 싶었던 말이 있었어.' },
  { id: 'thanks',    emoji: '🙏', label: '감사 편지', example: '그때 네가 없었으면 나 정말 힘들었을 거야. 고마워.' },
  { id: 'tease',     emoji: '😏', label: '놀림 편지', example: '너 그때.....ㅋㅋㅋ..ㅋ.ㅋㅋ..ㅋㅋ.ㅋㅋㅋ' },
  { id: 'comfort',   emoji: '😢', label: '위로 편지', example: '괜찮아, 지금은 그냥 힘들어해도 돼.' },
  { id: 'welcome',   emoji: '👋', label: '환영 편지', example: '만나서 반가워. 앞으로 잘 부탁해.' },
  { id: 'farewell',  emoji: '🍾', label: '송별 편지', example: '그동안 정말 고마웠어. 어디서든 잘 지내길 바랄게.' }
];

// Fixed 16-color palette shared by both the composer (encoding) and the
// viewer (decoding) — since both sides run this same script, we never
// need to transmit the palette itself, only 4-bit indices into it.
const PALETTE = [
  [11,11,15],[58,58,66],[110,110,118],[168,168,174],[232,228,220],[247,243,236],
  [139,38,53],[193,68,58],[224,138,76],[240,194,75],
  [74,122,107],[47,93,80],[68,114,168],[44,62,107],
  [201,138,107],[122,90,68]
];

/* ===== Utilities ===== */
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
function formatUnlockDate(ms) {
  const d = new Date(ms);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} (${days[d.getDay()]}) ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function nextWorkdayMorning() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.getTime();
}
function getPresetTime(key) {
  const d = new Date();
  d.setSeconds(0, 0);
  switch (key) {
    case '1h': return Date.now() + 60 * 60 * 1000;
    case 'midnight': { const m = new Date(); m.setHours(24, 0, 0, 0); return m.getTime(); }
    case 'tomorrow9': { const m = new Date(); m.setDate(m.getDate() + 1); m.setHours(9, 0, 0, 0); return m.getTime(); }
    case 'month1': { const m = new Date(); m.setMonth(m.getMonth() + 1); return m.getTime(); }
    case 'day100': return Date.now() + 100 * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

/* ===== UTF-8 safe, URL-safe base64 + 경량 XOR 난독화 =====
   완벽한 암호화는 아니지만("서버가 없어서 진짜 비밀키를 숨길 곳이 없음"),
   최소한 링크를 아무 base64 디코더에 붙여넣는 것만으로는 원문이 그대로
   드러나지 않도록 한 단계 더 섞어준다. */
const NTS_OBF_KEY = 'ntsdrive-2026-link-is-the-key';
function ntsXor(bytes) {
  const key = new TextEncoder().encode(NTS_OBF_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}
function encodeLetter(obj) {
  const json = JSON.stringify(obj);
  const bytes = ntsXor(new TextEncoder().encode(json));
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeLetter(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const json = new TextDecoder().decode(ntsXor(bytes));
  return JSON.parse(json);
}

/* ===== Photo -> IMG_GRID x IMG_GRID / 16-color dot art ===== */
function nearestPaletteIndex(r, g, b) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const [pr, pg, pb] = PALETTE[i];
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}
function packIndices(indices) {
  const bytes = new Uint8Array(Math.ceil(indices.length / 2));
  for (let i = 0; i < indices.length; i += 2) {
    const hi = indices[i] & 0x0F;
    const lo = (indices[i + 1] != null ? indices[i + 1] : 0) & 0x0F;
    bytes[i / 2] = (hi << 4) | lo;
  }
  return bytes;
}
function unpackIndices(bytes, count) {
  const out = [];
  for (let i = 0; i < bytes.length; i++) {
    out.push((bytes[i] >> 4) & 0x0F);
    out.push(bytes[i] & 0x0F);
  }
  return out.slice(0, count);
}
function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64ToBytes(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function processImageFile(file, onDone) {
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    toast(`사진은 ${MAX_PHOTO_MB}MB 이하로 올려주세요.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = IMG_GRID; off.height = IMG_GRID;
      const ctx = off.getContext('2d');
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, IMG_GRID, IMG_GRID);
      const data = ctx.getImageData(0, 0, IMG_GRID, IMG_GRID).data;
      const indices = [];
      for (let i = 0; i < data.length; i += 4) {
        indices.push(nearestPaletteIndex(data[i], data[i + 1], data[i + 2]));
      }
      onDone(indices);
    };
    img.onerror = () => toast('사진을 읽을 수 없어요. 다른 파일로 시도해주세요.');
    img.src = e.target.result;
  };
  reader.onerror = () => toast('사진을 읽을 수 없어요.');
  reader.readAsDataURL(file);
}

function renderPixelCanvas(indices, canvas, grid) {
  grid = grid || IMG_GRID;
  canvas.width = grid; canvas.height = grid;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(grid, grid);
  for (let i = 0; i < indices.length; i++) {
    const [r, g, b] = PALETTE[indices[i]] || [0, 0, 0];
    imgData.data[i * 4] = r; imgData.data[i * 4 + 1] = g; imgData.data[i * 4 + 2] = b; imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== GA4 helper (fails silently if gtag isn't loaded) ===== */
function trackEvent(name, params) {
  try {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  } catch (e) { /* no-op */ }
}
