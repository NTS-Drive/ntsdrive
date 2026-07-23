/* ============================================================
   NTS Drive · 공용 "바로가기 생성" (PWA 설치) 로직
   index.html, post/inbox.html, log/mylogs.html, diary/*.html 에서 공통 사용
   ============================================================ */
(function () {
  const INSTALLED_KEY = 'ntsdrive_pwa_installed';

  function isStandaloneNow() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
  }
  function isAlreadyInstalled() {
    let v = isStandaloneNow();
    try { v = v || localStorage.getItem(INSTALLED_KEY) === '1'; } catch (e) { /* ignore */ }
    return v;
  }
  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params || {}); } catch (e) { /* ignore */ }
  }

  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
  });

  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  window.handleCreateShortcut = function () {
    if (typeof trackEvent === 'function') trackEvent('shortcut_button_click');

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
        }
        if (typeof trackEvent === 'function') trackEvent('shortcut_created', { outcome: choice.outcome });
      }).finally(() => { deferredInstallPrompt = null; });
      return;
    }

    if (isAlreadyInstalled()) {
      alert('이미 설치가 되어있습니다. 지속 오류가 날 경우 삭제 후 재설치 해주세요.');
      return;
    }

    showManualInstallGuide();
  };

  function showManualInstallGuide() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (isIOS) {
      alert('이 기기에서는 자동으로 만들 수 없어요.\n\nSafari 하단의 공유 버튼(⬆️)을 누르고,\n"홈 화면에 추가"를 선택해주세요.');
    } else {
      alert('브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요.\n(브라우저 우측 상단 메뉴 또는 주소창 아이콘에서 찾으실 수 있어요.)');
    }
  }

  /* ---------------- 자동 바로가기 안내 (상단 배너 하나로 통일) ---------------- */
  // 조건: standalone 아님 + 아직 설치 안 함 + 지금 인앱 브라우저 안이 아님(그건
  // 오버레이가 따로 안내함) + 이번 세션에서 "명시적으로 닫은 적"이 없음.
  //
  // 그냥 보여줬다가 유저가 별다른 반응 없이 다음 페이지로 넘어간 것만으로는
  // 억제하지 않는다 — 그 경우 다음 페이지에서도 다시 뜬다. "✕로 직접 닫았을
  // 때"만 그 세션 동안 완전히 조용해진다(설치 완료도 당연히 조용해짐).
  const DISMISSED_KEY = 'ntsdrive_shortcut_dismissed';

  function maybeShowShortcutReminder() {
    if (isAlreadyInstalled()) return;
    if (typeof window !== 'undefined' && window.NTSInAppBrowser) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch (e) { /* ignore */ }
    if (dismissed) return;
    mountShortcutTopbar();
  }

  function mountShortcutTopbar() {
    const style = document.createElement('style');
    style.textContent = `
      .nts-shortcut-topbar{position:relative; z-index:90; background:#17140F; color:#F7F3EC; padding:10px 16px; display:flex; align-items:center; gap:10px; font-size:12.5px; line-height:1.5;}
      .nts-shortcut-topbar span{flex:1;}
      .nts-shortcut-topbar .nts-shortcut-go{flex-shrink:0; background:#F7F3EC; color:#17140F; border:none; border-radius:99px; padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer;}
      .nts-shortcut-topbar .nts-shortcut-close{flex-shrink:0; background:none; border:none; color:#F7F3EC; opacity:0.7; font-size:13px; cursor:pointer; padding:4px;}
      @media (min-width:761px){ .nts-shortcut-topbar{justify-content:center; text-align:center;} }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.className = 'nts-shortcut-topbar';
    el.innerHTML = `<span>홈 화면에 바로가기 추가하면 모든 기록을 한 곳에서 관리할 수 있어요</span><button type="button" class="nts-shortcut-go" id="ntsShortcutTopGo">추가하기</button><button type="button" class="nts-shortcut-close" id="ntsShortcutTopClose" aria-label="닫기">✕</button>`;
    document.body.insertBefore(el, document.body.firstChild);
    trackEventSafe('shortcut_topbar_shown');

    el.querySelector('#ntsShortcutTopGo').addEventListener('click', () => {
      trackEventSafe('shortcut_topbar_click');
      window.handleCreateShortcut();
      el.remove();
    });
    el.querySelector('#ntsShortcutTopClose').addEventListener('click', () => {
      trackEventSafe('shortcut_topbar_dismissed');
      try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch (e) { /* ignore */ }
      el.remove();
    });
  }

  if (document.body) maybeShowShortcutReminder();
  else document.addEventListener('DOMContentLoaded', maybeShowShortcutReminder);
})();
