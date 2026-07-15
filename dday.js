/* ============================================================
   NTS Drive · 홈 디데이 위젯
   - 0개: 시계 위젯 그대로 + "+ 디데이 추가" 버튼
   - 1개 이상: 시계 자동으로 숨겨지고 디데이 위젯으로 전환
     · 가장 임박한 1개는 큰 카드(계절 그라데이션)
     · 나머지 최대 2개는 칩(고정폭, 왼쪽정렬)
     · 최대 총 3개(큰 카드 1 + 칩 2)
   ============================================================ */
(function () {
  const STORAGE_KEY = 'ntsdrive_ddays_v1';
  const CELEBRATED_KEY = 'ntsdrive_dday_celebrated_v1';
  const MAX_DDAYS = 3;

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function loadDdays() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveDdays(list) {
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

  function getSeason(dateStr) {
    const month = parseInt(dateStr.slice(5, 7), 10);
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
  function daysLeft(dateStr) {
    const today = new Date(todayStr() + 'T00:00:00');
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target - today) / (24 * 60 * 60 * 1000));
  }
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${dow})`;
  }
  function sortedDdays() {
    return loadDdays().slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  }

  let editMode = false;
  let menuOpen = false;

  function render() {
    const clockEl = document.getElementById('clockWidget');
    const wrapEl = document.getElementById('ddayWidget');
    if (!clockEl || !wrapEl) return;

    const list = sortedDdays();

    if (list.length === 0) {
      clockEl.style.display = '';
      wrapEl.innerHTML = `<button class="add-dday-btn" onclick="NTSDday.openAddModal()">+ 디데이 추가</button>`;
      return;
    }

    clockEl.style.display = 'none';
    const big = list[0];
    const chips = list.slice(1, MAX_DDAYS);
    const season = getSeason(big.date);
    const dl = daysLeft(big.date);
    const bigLabel = dl === 0 ? 'D-DAY' : dl > 0 ? `D-${dl}` : `D+${Math.abs(dl)}`;

    const chipHtml = chips.map(c => {
      const cdl = daysLeft(c.date);
      const cLabel = cdl === 0 ? 'D-DAY' : cdl > 0 ? `D-${cdl}` : `D+${Math.abs(cdl)}`;
      return `<div class="dday-chip" onclick="${editMode ? `NTSDday.openEditModal('${c.id}')` : `NTSDday.goToMoment('${c.date}')`}">
        ${editMode ? `<span class="dday-x" onclick="event.stopPropagation(); NTSDday.quickDelete('${c.id}')">×</span>` : ''}
        <div class="cn">${cLabel}</div><div class="ct">${escapeHtml(c.title)}</div>
      </div>`;
    }).join('');

    wrapEl.innerHTML = `
      <div class="dday-hero-card dday-${season}" onclick="${editMode ? `NTSDday.openEditModal('${big.id}')` : `NTSDday.goToMoment('${big.date}')`}">
        ${editMode ? `<span class="dday-x" onclick="event.stopPropagation(); NTSDday.quickDelete('${big.id}')">×</span>` : ''}
        <div class="dday-hero-num">${bigLabel}</div>
        <div class="dday-hero-title">${escapeHtml(big.title)}</div>
        <div class="dday-hero-date">${formatDate(big.date)}</div>
      </div>
      <div class="dday-chip-row">
        ${chipHtml}
        <div class="dday-menu-wrap">
          <div class="dday-more" onclick="NTSDday.toggleMenu(event)">⋯</div>
          ${menuOpen ? renderMenu(list.length) : ''}
        </div>
      </div>
    `;
  }

  function renderMenu(count) {
    const canAdd = count < MAX_DDAYS;
    const canEdit = count >= 1;
    return `<div class="dday-menu">
      ${canAdd ? `<button onclick="NTSDday.openAddModal()">새 디데이 추가</button>` : ''}
      ${canEdit ? `<button onclick="NTSDday.toggleEditMode()">${editMode ? '완료' : '편집하기'}</button>` : ''}
    </div>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    menuOpen = !menuOpen;
    render();
    if (menuOpen) {
      setTimeout(() => {
        document.addEventListener('click', closeMenuOnce);
      }, 0);
    }
  }
  function closeMenuOnce() {
    menuOpen = false;
    document.removeEventListener('click', closeMenuOnce);
    render();
  }
  function toggleEditMode() {
    editMode = !editMode;
    menuOpen = false;
    render();
  }
  function quickDelete(id) {
    const list = loadDdays().filter(d => d.id !== id);
    saveDdays(list);
    render();
  }
  function goToMoment(dateStr) {
    window.location.href = `moment/index.html?date=${dateStr}`;
  }

  /* ---------------- 추가/수정 모달 ---------------- */
  function openAddModal() {
    menuOpen = false;
    render();
    showModal({ mode: 'add' });
  }
  function openEditModal(id) {
    menuOpen = false;
    const item = loadDdays().find(d => d.id === id);
    if (!item) return;
    showModal({ mode: 'edit', item });
  }
  function closeModal() {
    const el = document.getElementById('ddayModalBackdrop');
    if (el) el.remove();
  }
  function showModal({ mode, item }) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'dday-modal-backdrop';
    backdrop.id = 'ddayModalBackdrop';
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
    backdrop.innerHTML = `
      <div class="dday-modal">
        <h3>${mode === 'add' ? '새 디데이 추가' : '디데이 수정'}</h3>
        <label>제목</label>
        <input type="text" id="ddayTitleInput" maxlength="20" placeholder="예: 기말고사" value="${item ? escapeHtml(item.title) : ''}">
        <label>날짜</label>
        <input type="date" id="ddayDateInput" value="${item ? item.date : ''}">
        <div class="row-actions">
          ${mode === 'edit' ? `<button class="btn-delete" onclick="NTSDday.deleteFromModal('${item.id}')">삭제</button>` : `<button class="btn-cancel" onclick="NTSDday.closeModal()">취소</button>`}
          <button class="btn-save" onclick="NTSDday.saveFromModal('${mode}'${item ? `, '${item.id}'` : ''})">저장</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }
  function saveFromModal(mode, id) {
    const title = document.getElementById('ddayTitleInput').value.trim();
    const date = document.getElementById('ddayDateInput').value;
    if (!title) { alert('제목을 입력해주세요.'); return; }
    if (!date) { alert('날짜를 선택해주세요.'); return; }

    let list = loadDdays();
    if (mode === 'add') {
      if (list.length >= MAX_DDAYS) { alert(`디데이는 최대 ${MAX_DDAYS}개까지 등록할 수 있어요.`); return; }
      list.push({ id: 'dd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), title, date });
      trackEventSafe('dday_added');
    } else {
      list = list.map(d => d.id === id ? { ...d, title, date } : d);
      trackEventSafe('dday_edited');
    }
    saveDdays(list);
    closeModal();
    render();
  }
  function deleteFromModal(id) {
    quickDelete(id);
    closeModal();
    trackEventSafe('dday_deleted');
  }
  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params); } catch (e) { /* ignore */ }
  }

  /* ---------------- 디데이 도달 연출 ---------------- */
  function checkCelebration() {
    const today = todayStr();
    const celebrated = loadCelebrated();
    const due = sortedDdays().find(d => d.date <= today && !celebrated.includes(d.id));
    if (!due) return;
    showCelebration(due);
  }

  function showCelebration(item) {
    trackEventSafe('dday_celebration_shown', { dday_title: item.title });
    const overlay = document.createElement('div');
    overlay.className = 'dday-celebrate-overlay';
    overlay.innerHTML = `
      <div class="dday-celebrate-card">
        <div class="emoji">🎉</div>
        <h3>${escapeHtml(item.title)}, 오늘이에요</h3>
        <p>계속 기다려온 하루가 왔어요.</p>
        <button onclick="NTSDday.finishCelebration('${item.id}', '${escapeHtml(item.title).replace(/'/g, "&#39;")}')">확인</button>
      </div>
    `;
    document.body.appendChild(overlay);
    spawnConfetti(getSeason(item.date));
  }

  function spawnConfetti(season) {
    const palettes = {
      spring: ['#FCC9DB', '#F6DCA9', '#C7E9C9'],
      summer: ['#8FE3DC', '#4FBEDE', '#3E6FCB'],
      autumn: ['#F6D68A', '#E9974F', '#B96A26'],
      winter: ['#EDE4FB', '#C8B3EE', '#9B7FD4']
    };
    const colors = palettes[season] || palettes.spring;
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

  function finishCelebration(id, title) {
    markCelebrated(id);
    trackEventSafe('dday_reached', { dday_title: title });
    const list = loadDdays().filter(d => d.id !== id);
    saveDdays(list);
    const overlay = document.querySelector('.dday-celebrate-overlay');
    if (overlay) overlay.remove();
    render();
    // Diary로 자연스럽게 유도: "오늘 기분은 어떤가요?"
    window.location.href = `diary/index.html?ddaytitle=${encodeURIComponent(title)}`;
  }

  // confetti 낙하 애니메이션 keyframes 주입
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes confettiFall { to { transform: translateY(100vh) rotate(360deg); opacity:0.3; } }`;
  document.head.appendChild(styleTag);

  window.NTSDday = {
    render, toggleMenu, toggleEditMode, quickDelete, goToMoment,
    openAddModal, openEditModal, closeModal, saveFromModal, deleteFromModal,
    finishCelebration, checkCelebration
  };

  document.addEventListener('DOMContentLoaded', () => {
    render();
    checkCelebration();
  });
  // DOMContentLoaded가 이미 지난 뒤 스크립트가 로드되는 경우 대비
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    render();
    checkCelebration();
  }
})();
