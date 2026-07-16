/* ============================================================
   NTS Drive · 홈 D-day 카드 (Post 연동형)
   - Post "나에게" 편지 작성 시에만 등록 가능, 최대 1개(진행 중일 때 신규 등록 불가)
   - D-day 날짜 = 해당 편지의 잠금해제 시각과 동일
   - 0개(또는 미진행): 시계 위젯 그대로
   - 1개(진행 중): 시계 숨김, D-day 카드로 전환
   - 카드 클릭 시 해당 Post 편지 확인 화면으로 이동
   - 데이터는 배열로 저장(추후 여러 개 확장 대비), UI는 1개로 제한
   ============================================================ */
(function () {
  const STORAGE_KEY = 'ntsdrive_post_dday_v1';
  const CELEBRATED_KEY = 'ntsdrive_post_dday_celebrated_v1';

  function todayStr(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function loadList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveList(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }
  function loadCelebrated() {
    try {
      const raw = localStorage.getItem(CELEBRATED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function markCelebrated(id) {
    const list = loadCelebrated();
    if (!list.includes(id)) list.push(id);
    try { localStorage.setItem(CELEBRATED_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  // "진행 중" = 아직 잠금해제 시각이 지나지 않은 것. 지나면 새 등록이 가능해진다.
  function activeItem() {
    const list = loadList();
    return list.find(d => d.unlockMs > Date.now()) || null;
  }
  // 도달했지만(잠금해제 시각이 지났지만) 아직 카드로 남아있는 것(연출 대상)
  function dueItem() {
    const list = loadList();
    return list.find(d => d.unlockMs <= Date.now()) || null;
  }

  function daysLeft(unlockMs) {
    const today = new Date(todayStr() + 'T00:00:00');
    const target = new Date(todayStr(new Date(unlockMs)) + 'T00:00:00');
    return Math.round((target - today) / (24 * 60 * 60 * 1000));
  }
  function ddayLabel(unlockMs) {
    const remainMs = unlockMs - Date.now();
    if (remainMs > 0 && remainMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(remainMs / (60 * 60 * 1000));
      const minutes = Math.floor((remainMs % (60 * 60 * 1000)) / (60 * 1000));
      return hours > 0 ? `${hours}시간 ${minutes}분 남음` : `${minutes}분 남음`;
    }
    const dl = daysLeft(unlockMs);
    return dl === 0 ? 'D-DAY' : dl > 0 ? `D-${dl}` : `D+${Math.abs(dl)}`;
  }
  function formatDate(unlockMs) {
    const d = new Date(unlockMs);
    const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${dow})`;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  let menuOpen = false;
  let confirmOpen = false;

  function ringProgress(item) {
    const start = item.createdAt || item.unlockMs;
    const total = item.unlockMs - start;
    if (total <= 0) return Date.now() >= item.unlockMs ? 0 : 1;
    const remain = (item.unlockMs - Date.now()) / total;
    return Math.max(0, Math.min(1, remain));
  }
  const RING_R = 128;
  const RING_CIRC = 2 * Math.PI * RING_R;

  function render() {
    const clockEl = document.getElementById('clockWidget');
    const wrapEl = document.getElementById('ddayWidget');
    if (!clockEl || !wrapEl) return;

    // 도달한(연출 전) 항목이 있으면 그 카드를 그대로 보여준다. 없으면 진행 중인 것.
    const item = dueItem() || activeItem();

    if (!item) {
      clockEl.style.display = '';
      wrapEl.innerHTML = '';
      stopRingTicker();
      return;
    }

    clockEl.style.display = 'none';
    const label = ddayLabel(item.unlockMs);
    const isTimeLabel = label.includes('남음');
    // 음수 offset: 소모된(지나간) 영역이 12시 방향에서부터 시계 방향으로 쌓이고,
    // 남은 에너지가 그 뒤를 따라가듯 줄어드는 방향으로 보이게 함
    const dashoffset = -RING_CIRC * (1 - ringProgress(item));

    wrapEl.innerHTML = `
      <div class="dday-hero-card" onclick="NTSDday.goToPost('${item.encoded}')">
        <svg class="dday-ring" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="ddayGlassGrad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
              <stop offset="45%" stop-color="#F6CDBB" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.7"/>
            </linearGradient>
            <filter id="ddayGlassShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="#7A4A32" flood-opacity="0.22"/>
            </filter>
          </defs>
          <circle cx="150" cy="150" r="${RING_R}" class="dday-ring-track"/>
          <circle cx="150" cy="150" r="${RING_R}" class="dday-ring-progress"
            stroke-dasharray="${RING_CIRC}" stroke-dashoffset="${dashoffset}"
            transform="rotate(-90 150 150)"/>
        </svg>
        <div class="dday-more" onclick="event.stopPropagation(); NTSDday.toggleMenu(event)">⋯</div>
        ${menuOpen ? `<div class="dday-menu" onclick="event.stopPropagation();">
          <button onclick="NTSDday.openDeleteConfirm('${item.id}')">삭제하기</button>
        </div>` : ''}
        <div class="dday-hero-title">${escapeHtml(item.title)}</div>
        <div class="dday-hero-num${isTimeLabel ? ' is-time' : ''}">${label}</div>
        <div class="dday-hero-date">${formatDate(item.unlockMs)}</div>
      </div>
      ${confirmOpen ? renderDeleteConfirm(item.id) : ''}
    `;
    startRingTicker();
  }

  // 링이 시간에 따라 조금씩 줄어드는 걸 느낄 수 있도록 1분마다 갱신
  let ringTicker = null;
  function startRingTicker() {
    if (ringTicker) return;
    ringTicker = setInterval(render, 60000);
  }
  function stopRingTicker() {
    if (ringTicker) { clearInterval(ringTicker); ringTicker = null; }
  }

  function renderDeleteConfirm(id) {
    return `
      <div class="dday-modal-backdrop" onclick="if(event.target===this) NTSDday.closeDeleteConfirm()">
        <div class="dday-confirm-card" onclick="event.stopPropagation();">
          <p>정말 삭제하시겠어요?</p>
          <div class="row-actions">
            <button class="btn-cancel" onclick="NTSDday.closeDeleteConfirm()">취소</button>
            <button class="btn-delete" onclick="NTSDday.confirmDelete('${id}')">삭제</button>
          </div>
        </div>
      </div>`;
  }

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    menuOpen = !menuOpen;
    render();
    if (menuOpen) {
      setTimeout(() => document.addEventListener('click', closeMenuOnce), 0);
    }
  }
  function closeMenuOnce() {
    menuOpen = false;
    document.removeEventListener('click', closeMenuOnce);
    render();
  }
  function openDeleteConfirm(id) {
    menuOpen = false;
    confirmOpen = id;
    render();
  }
  function closeDeleteConfirm() {
    confirmOpen = false;
    render();
  }
  function confirmDelete(id) {
    const list = loadList().filter(d => d.id !== id);
    saveList(list);
    confirmOpen = false;
    trackEventSafe('dday_deleted');
    render();
  }
  function goToPost(encoded) {
    window.location.href = `post/index.html?d=${encoded}`;
  }
  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params); } catch (e) { /* ignore */ }
  }

  /* ---------------- Post에서 호출하는 등록 API ---------------- */
  function hasActive() {
    return !!activeItem();
  }
  function registerFromPost({ title, encoded, unlockMs }) {
    if (activeItem()) {
      return { ok: false, message: '진행 중인 D-day가 끝난 뒤에 새로 등록할 수 있어요.' };
    }
    const list = loadList();
    list.push({
      id: 'pdd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title, encoded, unlockMs, createdAt: Date.now()
    });
    saveList(list);
    trackEventSafe('dday_added');
    return { ok: true };
  }

  /* ---------------- 디데이 도달 연출 ---------------- */
  function checkCelebration() {
    // 도달 연출은 "홈메인 진입 최초 1회"에만 뜬다. Post 편지 확인 화면 등
    // 홈이 아닌 곳에서는(=#clockWidget이 없는 페이지) 절대 띄우지 않는다.
    if (!document.getElementById('clockWidget')) return;
    const item = dueItem();
    if (!item) return;
    const celebrated = loadCelebrated();
    if (celebrated.includes(item.id)) return;
    showCelebration(item);
  }

  function showCelebration(item) {
    trackEventSafe('dday_celebration_shown', { dday_title: item.title });
    const overlay = document.createElement('div');
    overlay.className = 'dday-celebrate-overlay';
    overlay.innerHTML = `
      <div class="dday-celebrate-card">
        <div class="emoji">🎉</div>
        <button class="dday-celebrate-close" onclick="NTSDday.dismissCelebration('${item.id}')" aria-label="닫기">×</button>
        <h3>${escapeHtml(item.title)}, 오늘이에요</h3>
        <p>계속 기다려온 하루가 왔어요.<br>오늘 기분은 어떤가요?</p>
        <button class="btn-primary" onclick="NTSDday.finishCelebration('${item.id}')">마음 기록하기</button>
        <button class="btn-secondary" onclick="NTSDday.viewLetterFromCelebration('${item.id}')">편지 확인하기</button>
      </div>
    `;
    document.body.appendChild(overlay);
    spawnConfetti();
  }

  function spawnConfetti() {
    const colors = ['#F6CDBB', '#DDEDF0', '#D1D7F1', '#FFFFFF'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animation = `confettiFall ${1.6 + Math.random() * 1.2}s ease-in forwards`;
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }
  }

  function closeCelebrationAndFree(id) {
    markCelebrated(id);
    const list = loadList().filter(d => d.id !== id);
    saveList(list);
    const overlay = document.querySelector('.dday-celebrate-overlay');
    if (overlay) overlay.remove();
    render();
  }

  function finishCelebration(id) {
    const item = loadList().find(d => d.id === id);
    const title = item ? item.title : '';
    trackEventSafe('dday_reached', { dday_title: title, action: 'record' });
    closeCelebrationAndFree(id);
    window.location.href = `diary/index.html?ddaytitle=${encodeURIComponent(title)}`;
  }
  function viewLetterFromCelebration(id) {
    const item = loadList().find(d => d.id === id);
    const encoded = item ? item.encoded : null;
    trackEventSafe('dday_reached', { action: 'view_letter' });
    closeCelebrationAndFree(id);
    if (encoded) window.location.href = `post/index.html?d=${encoded}`;
  }
  function dismissCelebration(id) {
    trackEventSafe('dday_reached', { action: 'dismiss' });
    closeCelebrationAndFree(id);
  }

  // confetti 낙하 애니메이션 keyframes 주입
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes confettiFall { to { transform: translateY(100vh) rotate(360deg); opacity:0.3; } }`;
  document.head.appendChild(styleTag);

  window.NTSDday = {
    render, toggleMenu, openDeleteConfirm, closeDeleteConfirm, confirmDelete, goToPost,
    hasActive, registerFromPost,
    finishCelebration, viewLetterFromCelebration, dismissCelebration, checkCelebration
  };

  document.addEventListener('DOMContentLoaded', () => {
    render();
    checkCelebration();
  });
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    render();
    checkCelebration();
  }
})();
