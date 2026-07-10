/* ===== Constants ===== */
function navigate(url) {
  document.body.classList.add('leaving');
  setTimeout(() => { window.location.href = url; }, 260);
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('leaving');
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
    case 'nextwork9': return nextWorkdayMorning();
    default: return null;
  }
}

/* ===== UTF-8 safe, URL-safe base64 ===== */
function encodeLetter(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode('0x' + p1)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeLetter(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const json = decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
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

/* ===== Compose state ===== */
let composeState = {
  tpl: 0,
  photoMode: 'upload',
  photoIndices: null,
  photoSource: null, // 'upload' | 'draw'
  uploadIndices: null,
  drawIndices: null,
  unlockMs: getPresetTime('tomorrow9'),
  selectedPreset: 'tomorrow9'
};
let drawColorIndex = 6; // default pen color for the draw tool

const stage = document.getElementById('stage');

/* ===== Router ===== */
function render() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('d')) {
    try {
      const letter = decodeLetter(params.get('d'));
      if (Date.now() < letter.unlock) {
        renderLocked(letter);
      } else {
        renderReveal(letter);
      }
      return;
    } catch (e) {
      stage.innerHTML = `<div class="share-result"><div class="env-icon">✉️</div><h2>편지를 열 수 없어요</h2><p>링크가 손상되었을 수 있어요.</p></div>`;
      return;
    }
  }
  renderCompose();
}

/* ===== Compose screen ===== */
function renderCompose() {
  const tplRow = TEMPLATES.map((t, i) => `
    <div class="tpl-btn ${composeState.tpl === i ? 'selected' : ''}" onclick="selectTemplate(${i})">
      <span class="tpl-emoji">${t.emoji}</span>
      <span class="tpl-label">${t.label}</span>
    </div>
  `).join('');

  stage.innerHTML = `
    <div class="masthead">
      <div class="kicker">Post</div>
      <h1>지금 나의 마음을,<br>미래의 너에게</h1>
      <div class="sub">시간이 지나야 열리는, 온전한 마음을 담는 편지</div>
    </div>

    <div class="tpl-row">${tplRow}</div>
    <div class="tpl-example" id="tplExample">"${TEMPLATES[composeState.tpl].example}"</div>

    <div class="compose-paper">
      <div class="two-col">
        <div class="field">
          <label>받는 사람</label>
          <input type="text" id="toName" maxlength="20" placeholder="예: 은우">
        </div>
        <div class="field">
          <label>보내는 사람</label>
          <input type="text" id="fromName" maxlength="20" placeholder="예: 지민">
        </div>
      </div>

      <div class="field">
        <label>편지 제목</label>
        <input type="text" id="letterTitle" maxlength="40" placeholder="편지에 제목을 붙여보세요">
      </div>

      <div class="field" style="margin-bottom:0;">
        <label>편지 내용</label>
        <textarea id="letterBody" maxlength="${MAX_CHARS}" placeholder="지금의 마음을 적어보세요"></textarea>
        <div class="char-count" id="charCount">0 / ${MAX_CHARS}</div>
      </div>
    </div>

    <div class="field">
      <label>링크 (선택)</label>
      <input type="text" id="hiddenLink" placeholder="https://...">
    </div>

    <div class="field">
      <label>사진 (선택 - 그림으로 변환됩니다)</label>
      <div class="photo-tabs">
        <button type="button" class="photo-tab-btn ${composeState.photoMode === 'upload' ? 'active' : ''}" onclick="switchPhotoMode('upload', this)">업로드</button>
        <button type="button" class="photo-tab-btn ${composeState.photoMode === 'draw' ? 'active' : ''}" onclick="switchPhotoMode('draw', this)">직접 그리기</button>
      </div>
      <div id="photoModeArea"></div>
      <input type="file" id="photoInput" accept="image/*" style="display:none;">
    </div>

    <div class="field">
      <label>잠금 해제 시간</label>
      <div class="preset-row" id="presetRow"></div>
      <input type="datetime-local" id="unlockInput" value="${toDatetimeLocalValue(composeState.unlockMs)}">
    </div>

    <button class="seal-btn" id="sealBtn" onclick="handleSeal()">편지 봉인하기</button>
    <div class="disclaimer">이 잠금은 정말 열어보고 싶은 마음을 참는 재미를 위한 장치예요.<br>완벽한 보안 잠금은 아니라는 점, 참고해주세요.</div>
  `;

  renderPresetRow();
  renderPhotoModeArea();

  document.getElementById('letterBody').addEventListener('input', updateCharCount);
  document.getElementById('photoInput').addEventListener('change', e => {
    if (e.target.files[0]) {
      processImageFile(e.target.files[0], indices => {
        composeState.uploadIndices = indices;
        composeState.photoIndices = indices;
        composeState.photoSource = 'upload';
        renderPhotoModeArea();
      });
    }
  });
  document.getElementById('unlockInput').addEventListener('change', e => {
    composeState.unlockMs = new Date(e.target.value).getTime();
    composeState.selectedPreset = null;
    renderPresetRow();
  });
}

function selectTemplate(i) {
  composeState.tpl = i;
  document.querySelectorAll('.tpl-btn').forEach((el, idx) => el.classList.toggle('selected', idx === i));
  document.getElementById('tplExample').textContent = `"${TEMPLATES[i].example}"`;
}

function renderPresetRow() {
  const presets = [
    { key: '1h', label: '1시간 후' },
    { key: 'midnight', label: '오늘 자정' },
    { key: 'tomorrow9', label: '내일 아침 9시' },
    { key: 'nextwork9', label: '다음 출근일 아침' }
  ];
  document.getElementById('presetRow').innerHTML = presets.map(p => `
    <button type="button" class="preset-btn ${composeState.selectedPreset === p.key ? 'selected' : ''}" onclick="applyPreset('${p.key}')">${p.label}</button>
  `).join('');
}

function applyPreset(key) {
  composeState.selectedPreset = key;
  composeState.unlockMs = getPresetTime(key);
  document.getElementById('unlockInput').value = toDatetimeLocalValue(composeState.unlockMs);
  renderPresetRow();
}

function updateCharCount() {
  const body = document.getElementById('letterBody').value;
  const el = document.getElementById('charCount');
  el.textContent = `${body.length} / ${MAX_CHARS}`;
  el.classList.toggle('over', body.length >= MAX_CHARS);
}

function switchPhotoMode(mode, btn) {
  composeState.photoMode = mode;
  document.querySelectorAll('.photo-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPhotoModeArea();
}

function renderPhotoModeArea() {
  const area = document.getElementById('photoModeArea');
  if (!area) return;

  if (composeState.photoMode === 'upload') {
    if (composeState.uploadIndices) {
      area.innerHTML = `
        <div class="photo-preview-row">
          <canvas id="photoPreviewCanvas"></canvas>
          <span class="photo-remove" onclick="removePhoto()">사진 지우기</span>
        </div>
      `;
      renderPixelCanvas(composeState.uploadIndices, document.getElementById('photoPreviewCanvas'));
    } else {
      area.innerHTML = `<div class="photo-drop" onclick="document.getElementById('photoInput').click()">사진을 선택해주세요 (최대 ${MAX_PHOTO_MB}MB)</div>`;
    }
  } else {
    if (!composeState.drawIndices) composeState.drawIndices = initDrawIndices();
    const swatches = PALETTE.map((c, i) => `<span class="palette-swatch ${drawColorIndex === i ? 'selected' : ''}" style="background:rgb(${c[0]},${c[1]},${c[2]})" onclick="selectDrawColor(${i}, this)"></span>`).join('');
    area.innerHTML = `
      <div class="draw-palette">${swatches}</div>
      <canvas id="drawCanvas" class="draw-canvas" width="${IMG_GRID * 7}" height="${IMG_GRID * 7}"></canvas>
      <div class="draw-actions"><span class="photo-remove" onclick="clearDrawing()">전체 지우기</span></div>
    `;
    setupDrawCanvas();
  }
}

function removePhoto() {
  composeState.uploadIndices = null;
  document.getElementById('photoInput').value = '';
  if (composeState.photoSource === 'upload') {
    composeState.photoIndices = null;
    composeState.photoSource = null;
  }
  renderPhotoModeArea();
}

/* ===== Draw tool (16-color palette, same grid the photo path uses) ===== */
function initDrawIndices() {
  return new Array(IMG_GRID * IMG_GRID).fill(5); // blank cream background (palette index 5)
}
function selectDrawColor(i, btn) {
  drawColorIndex = i;
  document.querySelectorAll('.palette-swatch').forEach(el => el.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
}
function clearDrawing() {
  composeState.drawIndices = initDrawIndices();
  if (composeState.photoSource === 'draw') {
    composeState.photoIndices = null;
    composeState.photoSource = null;
  }
  renderPhotoModeArea();
}
function setupDrawCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / IMG_GRID;

  function paintFull() {
    for (let y = 0; y < IMG_GRID; y++) {
      for (let x = 0; x < IMG_GRID; x++) {
        const [r, g, b] = PALETTE[composeState.drawIndices[y * IMG_GRID + x]];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  paintFull();

  function paintAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = Math.floor((clientX - rect.left) * (canvas.width / rect.width) / cell);
    const cy = Math.floor((clientY - rect.top) * (canvas.height / rect.height) / cell);
    if (cx < 0 || cy < 0 || cx >= IMG_GRID || cy >= IMG_GRID) return;
    composeState.drawIndices[cy * IMG_GRID + cx] = drawColorIndex;
    const [r, g, b] = PALETTE[drawColorIndex];
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(cx * cell, cy * cell, cell, cell);
    composeState.photoIndices = composeState.drawIndices;
    composeState.photoSource = 'draw';
  }

  let drawing = false;
  canvas.onmousedown = e => { drawing = true; paintAt(e.clientX, e.clientY); };
  canvas.onmousemove = e => { if (drawing) paintAt(e.clientX, e.clientY); };
  window.addEventListener('mouseup', () => { drawing = false; });
  canvas.ontouchstart = e => { drawing = true; const t = e.touches[0]; paintAt(t.clientX, t.clientY); e.preventDefault(); };
  canvas.ontouchmove = e => { if (drawing) { const t = e.touches[0]; paintAt(t.clientX, t.clientY); } e.preventDefault(); };
  canvas.ontouchend = () => { drawing = false; };
}

function handleSeal() {
  const body = document.getElementById('letterBody').value.trim();
  if (!body) { toast('편지 내용을 적어주세요.'); return; }
  if (body.length > MAX_CHARS) { toast(`편지는 ${MAX_CHARS}자 이내로 적어주세요.`); return; }
  if (!composeState.unlockMs || composeState.unlockMs <= Date.now()) {
    toast('잠금 해제 시간은 현재보다 미래여야 해요.');
    return;
  }

  let hiddenLink = document.getElementById('hiddenLink').value.trim();
  if (hiddenLink && !/^https?:\/\//i.test(hiddenLink)) hiddenLink = 'https://' + hiddenLink;

  const letter = {
    tpl: composeState.tpl,
    to: document.getElementById('toName').value.trim(),
    from: document.getElementById('fromName').value.trim(),
    title: document.getElementById('letterTitle').value.trim(),
    body,
    link: hiddenLink || null,
    unlock: composeState.unlockMs,
    img: composeState.photoIndices ? bytesToBase64(packIndices(composeState.photoIndices)) : null,
    imgGrid: composeState.photoIndices ? IMG_GRID : null // records the grid size THIS letter's photo was encoded at, so future code changes to IMG_GRID never break old links
  };

  const encoded = encodeLetter(letter);
  const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
  renderShareResult(url);
}

function renderShareResult(url) {
  stage.innerHTML = `
    <div class="share-result">
      <div class="env-icon">✉️</div>
      <h2>편지가 봉인됐어요</h2>
      <p>아래 링크를 전달하면, 설정한 시간이 될 때까지<br>편지는 봉투 안에서 기다리고 있을 거예요.</p>
      <div class="link-box">
        <input type="text" id="shareUrl" readonly value="${url}">
      </div>
      <div class="share-actions">
        <button class="ghost-btn" onclick="copyShareLink('${url}')">링크 복사</button>
        <button class="ghost-btn" onclick="shareLink('${url}')">공유하기</button>
      </div>
      <div class="write-again"><a onclick="navigate(location.pathname)">편지 한 통 더 쓰기</a></div>
    </div>
  `;
}
function copyShareLink(url) {
  // Copies the raw link only (no explanatory text prepended) — combining
  // text + URL previously caused some paste targets (e.g. an address bar)
  // to treat the whole thing as a search query instead of a link.
  navigator.clipboard.writeText(url).then(() => toast('링크가 복사됐어요.')).catch(() => toast('복사에 실패했어요.'));
}
function shareLink(url) {
  if (navigator.share) {
    navigator.share({ title: 'Post — 시간이 닿아야 열리는 편지', url }).catch(() => {});
  } else {
    copyShareLink(url);
  }
}

/* ===== Locked screen ===== */
let lockedTimerId = null;
function renderLocked(letter) {
  const tpl = TEMPLATES[letter.tpl] || TEMPLATES[0];
  stage.innerHTML = `
    <div class="envelope-stage">
      <div class="envelope"><span class="seal">${tpl.emoji}</span></div>
      <h2>아직 열 수 없는 편지예요</h2>
      <div class="countdown" id="countdown">--:--:--</div>
      <div class="unlock-date">${formatUnlockDate(letter.unlock)}에 열려요</div>
    </div>
  `;
  updateCountdown(letter);
  clearInterval(lockedTimerId);
  lockedTimerId = setInterval(() => updateCountdown(letter), 1000);
}
function updateCountdown(letter) {
  const remain = letter.unlock - Date.now();
  if (remain <= 0) {
    clearInterval(lockedTimerId);
    renderReveal(letter);
    return;
  }
  const s = Math.floor(remain / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const el = document.getElementById('countdown');
  if (!el) return;
  el.textContent = days > 0
    ? `${days}일 ${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`
    : `${pad2(hours)}:${pad2(mins)}:${pad2(secs)}`;
}

/* ===== Reveal screen ===== */
function renderReveal(letter) {
  const tpl = TEMPLATES[letter.tpl] || TEMPLATES[0];
  const photoHtml = letter.img ? `
    <div class="letter-photo-wrap"><canvas id="revealCanvas"></canvas></div>
  ` : '';
  const safeLink = letter.link && /^https?:\/\//i.test(letter.link) ? letter.link : null;
  stage.innerHTML = `
    <div class="letter-paper">
      <div class="letter-meta"><span>${tpl.emoji} ${tpl.label}</span><span>${formatUnlockDate(letter.unlock)}</span></div>
      ${letter.to ? `<div class="tpl-example" style="margin:0 0 18px; text-align:left; padding:0;">${escapeHtml(letter.to)}에게</div>` : ''}
      ${letter.title ? `<div class="letter-title">${escapeHtml(letter.title)}</div>` : ''}
      ${photoHtml}
      <div class="letter-body">${escapeHtml(letter.body)}</div>
      ${letter.from ? `<div class="letter-sign">— ${escapeHtml(letter.from)}</div>` : ''}
      ${safeLink ? `<div class="hidden-link-row"><a class="hidden-link-btn" href="${safeLink}" target="_blank" rel="noopener">숨겨둔 마음 보기</a></div>` : ''}
    </div>
    <div class="reveal-actions">
      <button class="ghost-btn" onclick="saveLetterImage()">편지 저장하기</button>
      <button class="ghost-btn" onclick="navigate(location.pathname)">나도 편지 써보기</button>
    </div>
  `;
  if (letter.img) {
    const grid = letter.imgGrid || 32; // links sealed before this field existed were always 32x32
    const indices = unpackIndices(base64ToBytes(letter.img), grid * grid);
    renderPixelCanvas(indices, document.getElementById('revealCanvas'), grid);
  }
}

function saveLetterImage() {
  const paper = document.querySelector('.letter-paper');
  if (!paper || typeof html2canvas === 'undefined') { toast('저장 기능을 불러오지 못했어요.'); return; }
  html2canvas(paper, { backgroundColor: '#F7F3EC', scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `편지_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('편지가 저장됐어요.');
  }).catch(() => toast('저장에 실패했어요.'));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

render();
