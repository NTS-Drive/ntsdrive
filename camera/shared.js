/* ===== Shared across snap/index.html, film/index.html, album/index.html ===== */

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

const ALBUM_KEY = 'camera_album_v1';
const RETENTION_DAYS = 14;
const MAX_PHOTOS = 24;
const CAPTURE_WIDTH = 600; // px — 24컷 기준으로 예산 여유가 생겨 소폭 상향
const JPEG_QUALITY = 0.68;
const FILM_DELAY_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// localStorage on this origin is shared with Post's inbox and Log's room
// data (both lightweight text). The safest cross-browser assumption is a
// ~5MB total quota (Safari is the tightest). Camera photos are the only
// heavy consumer, so we cap the WHOLE album to a fixed byte budget —
// independent of the 36-photo/2-week limits above — so a run of large
// photos can never crowd out Post/Log's much smaller storage needs.
const CAMERA_BYTE_BUDGET = 2 * 1024 * 1024; // 2MB reserved for camera_album_v1 only

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function pad2(n) { return String(n).padStart(2, '0'); }
function formatDateTime(ms) {
  const d = new Date(ms);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} (${days[d.getDay()]}) ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ===== Storage: one shared array for both Snap and Film photos ===== */
function loadAlbum() {
  let list;
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
  } catch (e) {
    list = [];
  }
  return applyRetention(list);
}

// Drops photos older than RETENTION_DAYS, then trims to the newest MAX_PHOTOS,
// then — on top of both — evicts the oldest remaining photos until the
// whole album fits inside CAMERA_BYTE_BUDGET. This last step is what
// actually protects Post/Log: count and age limits alone don't guarantee
// a byte ceiling if individual photos vary in size.
function applyRetention(list) {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let kept = list.filter(p => p.createdAt >= cutoff);
  kept.sort((a, b) => b.createdAt - a.createdAt);
  if (kept.length > MAX_PHOTOS) kept = kept.slice(0, MAX_PHOTOS);
  kept = enforceByteBudget(kept);
  if (kept.length !== list.length) saveAlbumRaw(kept);
  return kept;
}

function byteSizeOf(list) {
  try {
    return new Blob([JSON.stringify(list)]).size;
  } catch (e) {
    return JSON.stringify(list).length; // rough fallback, ~1 byte/char for this content
  }
}

// list must already be sorted newest-first; drops from the oldest end
// (the tail) until total size is back under budget.
function enforceByteBudget(list) {
  const trimmed = list.slice();
  while (trimmed.length > 0 && byteSizeOf(trimmed) > CAMERA_BYTE_BUDGET) {
    trimmed.pop(); // oldest is last, since list is newest-first
  }
  return trimmed;
}

function saveAlbumRaw(list) {
  try {
    localStorage.setItem(ALBUM_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

function addPhoto(photo) {
  let list = loadAlbum();
  list.unshift(photo);
  if (list.length > MAX_PHOTOS) list = list.slice(0, MAX_PHOTOS);
  list = enforceByteBudget(list);
  const ok = saveAlbumRaw(list);
  if (!ok) {
    toast('저장 공간이 부족해서 사진을 저장하지 못했어요.');
  } else if (!list.some(p => p.id === photo.id)) {
    // budget enforcement dropped the photo we just took (e.g. it alone
    // is larger than the whole remaining budget)
    toast('사진 용량이 너무 커서 저장하지 못했어요.');
    return false;
  }
  return ok;
}

function updatePhoto(id, patch) {
  const list = loadAlbum();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...patch };
  return saveAlbumRaw(list);
}

function removePhoto(id) {
  const list = loadAlbum().filter(p => p.id !== id);
  saveAlbumRaw(list);
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ===== Camera access ===== */
function openCamera(videoEl, facingMode, onError) {
  facingMode = facingMode || 'environment';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('이 브라우저에서는 카메라를 사용할 수 없어요.');
    if (onError) onError();
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false })
    .then(stream => {
      videoEl.srcObject = stream;
      videoEl.play();
    })
    .catch(() => {
      alert('카메라를 사용할 수 없어요. 브라우저 설정에서 카메라 권한을 확인해주세요.');
      if (onError) onError();
    });
}
function stopCamera(videoEl) {
  const stream = videoEl.srcObject;
  if (stream) stream.getTracks().forEach(t => t.stop());
  videoEl.srcObject = null;
}

/* ===== Capture a frame from <video> — aspect ratio differs by type for authenticity ===== */
// Snap: near-square (Instax Square-style). Film: 3:2 (classic 35mm frame).
function captureFrame(videoEl, ratio) {
  ratio = ratio || 1; // width / height
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  let cw, ch;
  if (vw / vh > ratio) { ch = vh; cw = vh * ratio; } else { cw = vw; ch = vw / ratio; }
  const sx = (vw - cw) / 2, sy = (vh - ch) / 2;

  const outW = CAPTURE_WIDTH;
  const outH = Math.round(CAPTURE_WIDTH / ratio);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, sx, sy, cw, ch, 0, 0, outW, outH);
  return canvas;
}

/* ===== Filters ===== */
function applySnapFilter(sourceCanvas) {
  // Warm, soft instant-photo color grade, then mounted inside a white
  // Instax-style frame (thicker bottom margin for the caption area).
  const ctx = sourceCanvas.getContext('2d');
  const data = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i] = clamp(px[i] * 1.08 + 8);       // R up (warm)
    px[i + 1] = clamp(px[i + 1] * 1.03 + 4); // G slight up
    px[i + 2] = clamp(px[i + 2] * 0.94);     // B down (less blue = warmer)
  }
  ctx.putImageData(data, 0, 0);

  const border = Math.round(sourceCanvas.width * 0.05);
  const bottomBorder = Math.round(sourceCanvas.height * 0.32);
  const framed = document.createElement('canvas');
  framed.width = sourceCanvas.width + border * 2;
  framed.height = sourceCanvas.height + border + bottomBorder;
  const fctx = framed.getContext('2d');
  fctx.fillStyle = '#FFFDF8';
  fctx.fillRect(0, 0, framed.width, framed.height);
  fctx.drawImage(sourceCanvas, border, border);
  return framed;
}

function applyFilmFilter(sourceCanvas) {
  // Warm, natural-saturation film look (Portra/golden-hour style) — inspired by real
  // film-camera scans: warm highlights, faint cool shadows, gentle contrast, soft grain.
  const w = sourceCanvas.width, h = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d');
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i], g = px[i + 1], b = px[i + 2];

    // split-tone: warm highlights, faint cool shadows
    const lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
    r = r + lum * 16 - (1 - lum) * 3;
    g = g + lum * 5;
    b = b - lum * 12 + (1 - lum) * 9;

    // gentle S-curve contrast
    r = (r - 128) * 1.07 + 128;
    g = (g - 128) * 1.07 + 128;
    b = (b - 128) * 1.07 + 128;

    // slight saturation lift (keep skies/greens vivid, unlike faded/expired look)
    const gray = r * 0.3 + g * 0.59 + b * 0.11;
    r = gray + (r - gray) * 1.12;
    g = gray + (g - gray) * 1.12;
    b = gray + (b - gray) * 1.08;

    px[i] = clamp(r);
    px[i + 1] = clamp(g);
    px[i + 2] = clamp(b);
  }
  ctx.putImageData(data, 0, 0);

  // grain (slightly softer than before)
  const grain = ctx.getImageData(0, 0, w, h);
  const gpx = grain.data;
  for (let i = 0; i < gpx.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    gpx[i] = clamp(gpx[i] + n);
    gpx[i + 1] = clamp(gpx[i + 1] + n);
    gpx[i + 2] = clamp(gpx[i + 2] + n);
  }
  ctx.putImageData(grain, 0, 0);

  // warm-toned vignette (brownish, not flat black — matches sunlit film scans)
  const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.4, w / 2, h / 2, w * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(35,22,12,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // orange date/time stamp, bottom-right — like an old date-back film camera
  const now = new Date();
  const stampText = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const fontSize = Math.round(w * 0.032);
  ctx.font = `700 ${fontSize}px 'Courier New', monospace`;
  ctx.fillStyle = '#FF8A1E';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 2;
  ctx.fillText(stampText, w - w * 0.03, h - h * 0.03);
  ctx.shadowBlur = 0;

  return sourceCanvas;
}
function clamp(v) { return Math.max(0, Math.min(255, v)); }

function pickFilmDelayHours() {
  return FILM_DELAY_HOURS[Math.floor(Math.random() * FILM_DELAY_HOURS.length)];
}

/* ===== GA4 helper (fails silently if gtag isn't loaded) ===== */
function trackEvent(name, params) {
  try {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  } catch (e) { /* no-op */ }
}

/* ===== Share (native file share) with a download fallback for browsers
   that don't support sharing image files. Never silently does nothing —
   always either shares, downloads, or explains why via an alert. ===== */
function dataUrlToFile(dataUrl, filename) {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta)[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function sharePhoto(dataUrl, filename, shareTitle) {
  const file = dataUrlToFile(dataUrl, filename);
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: shareTitle || 'NTS Drive' })
      .then(() => trackEvent('camera_photo_shared'))
      .catch(() => { /* user cancelled — not an error */ });
    return;
  }
  // Older/unsupported browser: fall back to a plain download, and say so.
  alert('이 브라우저는 사진 공유를 지원하지 않아요. 대신 다운로드로 저장해드릴게요.');
  downloadDataUrl(dataUrl, filename);
  trackEvent('camera_photo_downloaded_fallback');
}
