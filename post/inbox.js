const INBOX_KEY = 'post_inbox_v1';
const stage = document.getElementById('stage');
let checkTimerId = null;

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

    <div id="inboxList"></div>

    <div class="disclaimer">알림은 이 탭을 열어둔 상태에서만 울려요.<br>편지는 지금 사용 중인 브라우저에만 저장되니,<br>놓치지 않으려면 <a onclick="handleCreateShortcut()" style="color:#C17F2A; text-decoration:underline; cursor:pointer;">바로가기 생성</a>을 해주세요.</div>
  `;
  renderNotifyRow();
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
  const list = loadInbox();

  if (list.length === 0) {
    container.innerHTML = `<div class="inbox-empty">아직 등록된 편지가 없어요.<br>받은 링크를 위에 붙여넣어보세요.</div>`;
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
    return `
      <div class="inbox-card">
        <div class="inbox-card-icon">${tpl.emoji}</div>
        <a class="inbox-card-body" href="${url}">
          <div class="inbox-card-title">${tpl.label}</div>
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

render();
checkTimerId = setInterval(checkUnlocks, 15000);
