/* ============================================================
   NTS Drive · 리마인드(친구 생일) 기능
   - D-day(자기용, "나만의 중요한 날")와는 목적이 다른 별도 기능:
     리마인드는 "친구를 챙기는 날"(타인용)
   - 이름+생일(양력, MM-DD)을 등록해두면 매년 자동 반복 계산되고,
     D-3 시점부터 홈 화면에 카드로 노출된다
   - 등록 개수 제한 없음(리스트형), 서버 전송 없이 로컬 저장만
   ============================================================ */
(function () {
  const STORAGE_KEY = 'ntsdrive_remind_v1';

  function loadList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveList(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function todayStr(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 저장된 MM-DD를 "올해(지났으면 내년) 기준 가장 가까운 다음 발생일"로 매번 재계산.
  // 별도 연도별 데이터를 저장하지 않고 항상 그 자리에서 계산하는 방식.
  function nextOccurrence(mmdd) {
    const [mm, dd] = mmdd.split('-').map(Number);
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let target = new Date(now.getFullYear(), mm - 1, dd);
    if (target < todayMid) target = new Date(now.getFullYear() + 1, mm - 1, dd);
    return target;
  }
  function daysUntil(mmdd) {
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const target = nextOccurrence(mmdd);
    return Math.round((target - todayMid) / (24 * 60 * 60 * 1000));
  }

  function addRemind({ name, date }) {
    if (!name || !name.trim()) return { ok: false, message: '이름을 입력해주세요.' };
    if (!date || !/^\d{2}-\d{2}$/.test(date)) return { ok: false, message: '날짜를 선택해주세요.' };
    const list = loadList();
    list.push({ id: 'rmd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: name.trim(), date, createdAt: Date.now() });
    if (!saveList(list)) return { ok: false, message: '저장공간이 부족해서 추가하지 못했어요.' };
    trackEventSafe('remind_added');
    return { ok: true };
  }
  function removeRemind(id) {
    saveList(loadList().filter(r => r.id !== id));
  }
  // D-3 이내(당일 포함, 0~3)인 항목들만 골라 D-day가 가까운 순으로 정렬
  function upcoming() {
    return loadList()
      .map(r => ({ ...r, daysLeft: daysUntil(r.date) }))
      .filter(r => r.daysLeft >= 0 && r.daysLeft <= 3)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }
  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params); } catch (e) { /* ignore */ }
  }
  function formatDate(mmdd) {
    const [mm, dd] = mmdd.split('-');
    return `${Number(mm)}월 ${Number(dd)}일`;
  }

  const DISCOVERY_DISMISS_KEY = 'ntsdrive_remind_discovery_dismissed_v1';
  function isDiscoveryDismissed() {
    try { return localStorage.getItem(DISCOVERY_DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismissDiscovery() {
    try { localStorage.setItem(DISCOVERY_DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
    trackEventSafe('remind_discovery_dismissed');
    const sectionEl = document.getElementById('remindSection');
    if (sectionEl) sectionEl.style.display = 'none';
  }

  /* ---------------- 홈 화면 카드 렌더링 ---------------- */
  function renderHomeSection() {
    const sectionEl = document.getElementById('remindSection');
    const listEl = document.getElementById('remindList');
    if (!sectionEl || !listEl) return;

    const items = upcoming();
    if (items.length) {
      // C. 임박(D-3 이내) — 리스트로 노출
      sectionEl.style.display = '';
      listEl.innerHTML = items.map(r => {
        const label = r.daysLeft === 0 ? '오늘' : `D-${r.daysLeft}`;
        return `
          <div class="remind-row" onclick="NTSRemind.goToPost('${r.name.replace(/'/g, "\\'")}')">
            <span class="remind-row-emoji">🎂</span>
            <div class="remind-row-text">
              <div><b>${escapeHtml(r.name)}</b> 님의 생일이 ${label}이에요. 편지 써볼까요?</div>
              <div class="remind-row-date">${formatDate(r.date)}</div>
            </div>
          </div>`;
      }).join('');
      trackEventSafe('remind_card_shown', { count: items.length });
      return;
    }

    // A. 미등록 + 아직 안 닫음 — 발견용 카드 노출 (닫으면 영구적으로 다시 안 뜸)
    if (loadList().length === 0 && !isDiscoveryDismissed()) {
      sectionEl.style.display = '';
      listEl.innerHTML = `
        <div class="remind-row remind-discovery" onclick="navigate('remind/index.html')">
          <span class="remind-row-emoji">🎂</span>
          <div class="remind-row-text">
            <div>아직 등록된 리마인드가 없어요</div>
            <div class="remind-row-date">친구 생일 등록하기 →</div>
          </div>
          <span class="remind-row-close" onclick="event.stopPropagation(); NTSRemind.dismissDiscovery();">✕</span>
        </div>`;
      trackEventSafe('remind_discovery_shown');
      return;
    }

    // B. 등록은 했지만 임박한 게 없음 / 이미 발견 카드를 닫음 — 노출 안 함
    sectionEl.style.display = 'none';
    listEl.innerHTML = '';
  }
  function goToPost(name) {
    trackEventSafe('remind_card_clicked');
    const params = new URLSearchParams();
    params.set('tpl', 'celebrate');
    if (name) params.set('to', name);
    window.location.href = `post/index.html?${params.toString()}`;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  window.NTSRemind = { loadList, saveList, addRemind, removeRemind, upcoming, daysUntil, formatDate, renderHomeSection, goToPost, dismissDiscovery };

  document.addEventListener('DOMContentLoaded', renderHomeSection);
  if (document.readyState === 'interactive' || document.readyState === 'complete') renderHomeSection();
})();
