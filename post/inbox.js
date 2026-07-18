const INBOX_KEY = 'post_inbox_v1';
const stage = document.getElementById('stage');
let checkTimerId = null;

// ?add=<encoded> 로 들어오면(잠금화면의 "내 편지함에 등록해두세요" 링크),
// 붙여넣기 없이 자동으로 편지함에 등록한다.
function autoAddFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('add')) return;
  const encoded = params.get('add');
  try {
    const letter = decodeLetter(encoded);
    const list = loadInbox();
    if (!list.some(item => item.d === encoded)) {
      list.push({ d: encoded, addedAt: Date.now(), notified: Date.now() >= letter.unlock });
      saveInbox(list);
      toast('편지함에 등록됐어요.');
    }
  } catch (e) { /* 손상된 링크면 조용히 무시 */ }
  // 새로고침 시 중복 등록 시도를 막기 위해 URL을 정리한다.
  window.history.replaceState({}, '', window.location.pathname);
}

/* ===== Storage ===== */
function loadInbox() {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}
function saveInbox(list) {
  try {
    localStorage.setItem(INBOX_KEY, JSON.stringify(list));
  } catch (e) {
    toast('저장 공간이 부족해서 목록을 저장하지 못했어요.');
  }
}

/* ===== Adding a link ===== */
function extractEncoded(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const d = url.searchParams.get('d');
    return d || null;
  } catch (e) {
    // Not a full URL — maybe they pasted just the "?d=..." part or the raw token.
    const m = trimmed.match(/[?&]d=([^&]+)/);
    if (m) return m[1];
    return trimmed.length > 20 ? trimmed : null; // last-resort: assume it's the raw encoded token itself
  }
}

function addLink() {
  const input = document.getElementById('linkInput');
  const encoded = extractEncoded(input.value);
  if (!encoded) { toast('올바른 편지 링크가 아니에요.'); return; }

  let letter;
  try {
    letter = decodeLetter(encoded);
  } catch (e) {
    toast('편지 링크를 읽을 수 없어요.');
    return;
  }

  const list = loadInbox();
  if (list.some(item => item.d === encoded)) {
    toast('이미 등록된 편지예요.');
    input.value = '';
    return;
  }
  list.push({ d: encoded, addedAt: Date.now(), notified: Date.now() >= letter.unlock });
  saveInbox(list);
  input.value = '';
  toast('편지함에 등록됐어요.');
  renderInboxList();
}

function removeLetter(encoded) {
  const list = loadInbox().filter(item => item.d !== encoded);
  saveInbox(list);
  renderInboxList();
}

/* ===== Notifications (best-effort — only while this tab stays open) ===== */
function requestNotifyPermission() {
  if (!('Notification' in window)) { toast('이 브라우저는 알림을 지원하지 않아요.'); return; }
  Notification.requestPermission().then(perm => {
    trackEvent('post_inbox_notify_requested', { result: perm });
    if (perm === 'granted') toast('알림이 켜졌어요. 이 탭을 열어두시면 돼요.');
    renderInboxList();
  });
}

function checkUnlocks() {
  const list = loadInbox();
  let changed = false;
  const now = Date.now();
  list.forEach(item => {
    if (item.notified) return;
    try {
      const letter = decodeLetter(item.d);
      if (now >= letter.unlock) {
        item.notified = true;
        changed = true;
        if ('Notification' in window && Notification.permission === 'granted') {
          const tpl = TEMPLATES[letter.tpl] || TEMPLATES[0];
          new Notification('편지가 열렸어요 💌', {
            body: `${tpl.emoji} ${tpl.label}${letter.from ? ' · ' + letter.from : ''}`,
            tag: item.d.slice(0, 20)
          });
        }
      }
    } catch (e) { /* corrupted entry, ignore */ }
  });
  if (changed) {
    saveInbox(list);
    renderInboxList();
  } else {
    updateCountdownsOnly();
  }
}

/* ===== Rendering ===== */
function render() {
  stage.innerHTML = `
    <div class="masthead">
      <div class="kicker">Post</div>
      <h1>내 편지함</h1>
      <div class="sub">받은 편지를 모아두고,<br>열리는 순간을 놓치지 마세요</div>
    </div>

    <div class="inbox-steps">
      <div class="step"><div class="num">1</div><p>받은 편지 링크를 아래에 붙여넣어 등록하세요.</p></div>
      <div class="step"><div class="num">2</div><p>봉인된 편지는 카운트다운으로, 열린 편지는 바로 확인할 수 있어요.</p></div>
      <div class="step"><div class="num">3</div><p>이 탭을 열어두면, 편지가 열리는 순간 알림을 보내드려요.</p></div>
    </div>

    <div class="inbox-add-row">
      <input type="text" id="linkInput" placeholder="받은 편지 링크를 붙여넣으세요">
      <button class="ghost-btn" onclick="addLink()">등록</button>
    </div>

    <div class="inbox-notify-row" id="notifyRow"></div>

    <div class="preset-row" id="inboxFilterRow"></div>

    <div id="inboxList"></div>

    <div class="disclaimer">편지는 지금 사용 중인 브라우저에만 저장되니,<br>놓치지 않으려면 <a href="https://ntsdrive.com/settings/index.html" style="color:#C17F2A; text-decoration:underline;">주기적으로 백업</a>을 해주세요.</div>
  `;
  renderNotifyRow();
  renderInboxFilterRow();
  renderInboxList();
}

let inboxFilter = 'all'; // 'all' | 'sent' | 'received'
function renderInboxFilterRow() {
  const row = document.getElementById('inboxFilterRow');
  if (!row) return;
  const filters = [
    { key: 'all', label: '전체' },
    { key: 'sent', label: '내가 쓴 편지' },
    { key: 'received', label: '받은 편지' }
  ];
  row.innerHTML = filters.map(f => `
    <button type="button" class="preset-btn ${inboxFilter === f.key ? 'selected' : ''}" onclick="applyInboxFilter('${f.key}')">${f.label}</button>
  `).join('');
}
function applyInboxFilter(key) {
  inboxFilter = key;
  trackEvent('post_inbox_filter_used', { filter: key });
  renderInboxFilterRow();
  renderInboxList();
}

function renderNotifyRow() {
  const row = document.getElementById('notifyRow');
  if (!row) return;
  if (!('Notification' in window)) { row.innerHTML = ''; return; }
  if (Notification.permission === 'granted') {
    row.innerHTML = `<div class="notify-status">🔔 알림이 켜져 있어요. 이 탭을 열어두시면 편지가 열릴 때 알려드려요.</div>`;
  } else if (Notification.permission === 'denied') {
    row.innerHTML = `<div class="notify-status">🔕 알림이 차단되어 있어요. 브라우저 설정에서 허용하면 다시 받을 수 있어요.</div>`;
  } else {
    row.innerHTML = `<div class="notify-status">이 탭을 열어두면 편지가 열릴 때 알려드릴 수 있어요.<button class="ghost-btn" onclick="requestNotifyPermission()">알림 켜기</button></div>`;
  }
}

function renderInboxList() {
  const container = document.getElementById('inboxList');
  if (!container) return;
  const fullList = loadInbox();
  const list = fullList.filter(item => {
    if (inboxFilter === 'sent') return !!item.sent;
    if (inboxFilter === 'received') return !item.sent;
    return true;
  });

  if (fullList.length === 0) {
    container.innerHTML = `<div class="inbox-empty">아직 등록된 편지가 없어요.<br>받은 링크를 위에 붙여넣어보세요.</div>`;
    return;
  }
  if (list.length === 0) {
    const emptyMsg = inboxFilter === 'sent' ? '아직 내가 쓴 편지가 없어요.' : '아직 받은 편지가 없어요.';
    container.innerHTML = `<div class="inbox-empty">${emptyMsg}</div>`;
    return;
  }

  const entries = list.map(item => {
    let letter;
    try { letter = decodeLetter(item.d); } catch (e) { return null; }
    return { item, letter };
  }).filter(Boolean).sort((a, b) => a.letter.unlock - b.letter.unlock);

  container.innerHTML = entries.map(({ item, letter }) => {
    const tpl = TEMPLATES[letter.tpl] || TEMPLATES[0];
    const unlocked = Date.now() >= letter.unlock;
    const url = `index.html?d=${item.d}`;
    // item.sent는 이 브라우저에서 직접 봉인해서 자동 저장된 편지에만 true로
    // 찍힌다. 그 외(다른 사람이 준 "내 편지함에 등록" 링크로 저장된 경우)는
    // 알 수 없으므로 받는사람/보낸사람 이름으로 구분할 수 있게 보여준다.
    const kindTag = item.sent
      ? `<span class="inbox-kind-tag sent">내가 쓴 편지</span>`
      : `<span class="inbox-kind-tag">받은 편지</span>`;
    const whoLine = item.sent
      ? (letter.to ? `To. ${escapeHtml(letter.to)}` : tpl.label)
      : (letter.from ? `From. ${escapeHtml(letter.from)}` : tpl.label);
    return `
      <div class="inbox-card">
        <div class="inbox-card-icon">${tpl.emoji}</div>
        <a class="inbox-card-body" href="${url}">
          <div class="inbox-card-title">${kindTag}${whoLine}</div>
          <div class="inbox-card-status ${unlocked ? 'unlocked' : ''}" data-unlock="${letter.unlock}">
            ${unlocked ? '지금 열람 가능' : countdownText(letter.unlock)}
          </div>
        </a>
        <span class="inbox-card-remove" onclick="removeLetter('${item.d}')">삭제</span>
      </div>
    `;
  }).join('');
}

function countdownText(unlockMs) {
  const remain = unlockMs - Date.now();
  if (remain <= 0) return '지금 열람 가능';
  const s = Math.floor(remain / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}일 ${hours}시간 후 열림`;
  if (hours > 0) return `${hours}시간 ${mins}분 후 열림`;
  return `${mins}분 후 열림`;
}

function updateCountdownsOnly() {
  document.querySelectorAll('.inbox-card-status[data-unlock]').forEach(el => {
    if (el.classList.contains('unlocked')) return;
    const unlockMs = parseInt(el.dataset.unlock, 10);
    el.textContent = countdownText(unlockMs);
  });
}

autoAddFromUrl();
trackEvent('post_inbox_viewed', { total_letters: loadInbox().length });
render();
checkTimerId = setInterval(checkUnlocks, 15000);
