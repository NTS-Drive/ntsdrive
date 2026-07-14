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
    const encoded = params.get('d');
    try {
      const letter = decodeLetter(encoded);
      if (Date.now() < letter.unlock) {
        renderLocked(letter, encoded);
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

    <div class="inbox-steps" style="margin-bottom:28px;">
      <div class="step"><div class="num">1</div><p>받는 사람과 잠금이 풀리는 시간을 정해 편지를 써요.</p></div>
      <div class="step"><div class="num">2</div><p>편지 링크를 받는 사람에게 공유해요.</p></div>
      <div class="step"><div class="num">3</div><p>정해진 시간이 되면, 편지가 자동으로 열려요.</p></div>
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
        <textarea id="letterBody" maxlength="${MAX_CHARS}" placeholder="지금의 마음을 적어보세요" style="font-family:'NanumSonDahaeng',var(--font-serif);"></textarea>
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
      <input type="datetime-local" id="unlockInput" value="${toDatetimeLocalValue(composeState.unlockMs)}" style="display:none;">
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
    composeState.selectedPreset = 'custom';
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
    { key: 'midnight', label: '오늘밤 12시' },
    { key: 'tomorrow9', label: '내일 아침 9시' },
    { key: 'month1', label: '한 달 후' },
    { key: 'day100', label: '100일 후' },
    { key: 'custom', label: '직접입력' }
  ];
  document.getElementById('presetRow').innerHTML = presets.map(p => `
    <button type="button" class="preset-btn ${composeState.selectedPreset === p.key ? 'selected' : ''}" onclick="applyPreset('${p.key}')">${p.label}</button>
  `).join('');
  const unlockInputEl = document.getElementById('unlockInput');
  if (unlockInputEl) unlockInputEl.style.display = composeState.selectedPreset === 'custom' ? 'block' : 'none';
}

function applyPreset(key) {
  composeState.selectedPreset = key;
  if (key === 'custom') {
    // 직접입력: 프리셋 시간 계산 없이 날짜 피커만 노출 (기존 값 유지)
    renderPresetRow();
    const unlockInputEl = document.getElementById('unlockInput');
    if (unlockInputEl) unlockInputEl.focus();
    return;
  }
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
  trackEvent('post_letter_sealed', { template: TEMPLATES[composeState.tpl].id, has_photo: !!composeState.photoIndices, body_length: body.length });
  renderShareResult(url, encoded, letter.unlock);
}

// post/inbox.js의 loadInbox()가 읽는 것과 동일한 저장 형식(post_inbox_v1)을
// 그대로 따른다. 봉인 직후 바로 저장해두면, 편지함을 보려고 자기 링크를
// 다시 열어야 하는 불필요한 왕복이 없어진다.
function saveToMyInbox(encoded, unlockMs) {
  const INBOX_KEY = 'post_inbox_v1';
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];
    if (safeList.some(item => item.d === encoded)) return;
    safeList.unshift({ d: encoded, addedAt: Date.now(), notified: Date.now() >= unlockMs, sent: true });
    localStorage.setItem(INBOX_KEY, JSON.stringify(safeList));
  } catch (e) { /* 저장 공간 부족 등은 조용히 무시 — 공유 자체는 계속 진행 가능해야 함 */ }
}

function renderShareResult(url, encoded, unlockMs) {
  saveToMyInbox(encoded, unlockMs);
  stage.innerHTML = `
    <div class="share-result">
      <div class="env-icon">✉️</div>
      <h2>편지가 봉인됐어요</h2>
      <p>아래 링크를 전달하면, 설정한 시간이 될 때까지<br>편지는 봉투 안에서 기다리고 있을 거예요.</p>
      <button class="seal-btn" style="margin-bottom:10px;" onclick="shareLink('${url}')">지금 바로 공유하기</button>
      <button class="ghost-btn" style="width:100%; margin-bottom:16px;" onclick="copyShareLink('${url}')">링크만 복사하기</button>
      <div class="link-box">
        <input type="text" id="shareUrl" readonly value="${url}">
      </div>
      <p class="disclaimer" style="margin-top:16px;">내 편지함에도 자동으로 저장해뒀어요. 언제든 다시 확인할 수 있어요.</p>
    </div>
  `;
  // 참여자/방 생성 화면과 동일한 패턴: 사용자 클릭 체인 안에서 동기적으로
  // 호출해야 navigator.share()가 브라우저 정책에 막히지 않는다.
  if (navigator.share) {
    shareLink(url);
  }
}
function copyShareLink(url) {
  // Copies the raw link only (no explanatory text prepended) — combining
  // text + URL previously caused some paste targets (e.g. an address bar)
  // to treat the whole thing as a search query instead of a link.
  navigator.clipboard.writeText(url).then(() => { toast('링크가 복사됐어요.'); trackEvent('post_link_copied'); }).catch(() => toast('복사에 실패했어요.'));
}
function shareLink(url) {
  if (navigator.share) {
    navigator.share({ title: 'Post — 시간이 닿아야 열리는 편지', url }).then(() => trackEvent('post_link_shared')).catch(() => {});
  } else {
    copyShareLink(url);
  }
}

/* ===== Locked screen ===== */
let lockedTimerId = null;
function getMyInboxItem(encoded) {
  try {
    const raw = localStorage.getItem('post_inbox_v1');
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return null;
    return list.find(item => item.d === encoded) || null;
  } catch (e) { return null; }
}

function renderLocked(letter, encoded) {
  const tpl = TEMPLATES[letter.tpl] || TEMPLATES[0];
  const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
  const myItem = getMyInboxItem(encoded);
  const isMine = !!(myItem && myItem.sent);

  // 본인이 봉인한 편지라면(같은 기기), 봉인 화면에서 안 보내고 넘어왔을 수
  // 있으니 여기서도 링크를 다시 꺼낼 수 있게 한다. 받은 사람에게는 이
  // 버튼을 보여주지 않는다(남의 편지를 또 퍼뜨리는 상황 방지).
  const shareBlock = isMine ? `
    <div class="locked-share-block">
      <button class="seal-btn" style="margin-bottom:10px;" onclick="shareLink('${url}')">지금 바로 공유하기</button>
      <button class="ghost-btn" style="width:100%;" onclick="copyShareLink('${url}')">링크만 복사하기</button>
    </div>` : '';

  const inboxNote = myItem
    ? `<div class="locked-inbox-note">✓ 이미 편지함에 저장해뒀어요</div>`
    : `<div class="locked-inbox-note">이 편지, 나중에 다시 보고 싶다면?<br><a onclick="navigate('inbox.html?add=${encodeURIComponent(encoded)}')">내 편지함에 등록해두세요 →</a></div>`;

  stage.innerHTML = `
    <div class="envelope-stage">
      <div class="envelope"><span class="seal">${tpl.emoji}</span></div>
      <h2>아직 열 수 없는 편지예요</h2>
      <div class="countdown" id="countdown">--:--:--</div>
      <div class="unlock-date">${formatUnlockDate(letter.unlock)}에 열려요</div>
      ${shareBlock}
      ${inboxNote}
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

render();
