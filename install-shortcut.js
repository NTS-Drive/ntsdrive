/* ============================================================
   NTS Drive · 공용 "바로가기 생성" (PWA 설치) 로직
   index.html, post/inbox.html, log/mylogs.html, diary/*.html 에서 공통 사용
   ============================================================ */
(function () {
  const INSTALLED_KEY = 'ntsdrive_pwa_installed';
  const NUDGE_SHOWN_KEY = 'ntsdrive_shortcut_nudge_shown';

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

  // 페이지 로드 시점에 이미 설치되어 있는지 선제적으로 확인 (Chrome/Edge 지원).
  // beforeinstallprompt를 못 받은 상태라도, 실제로는 이미 설치돼있는 경우
  // (예: 예전 버전에서 설치했거나, 브라우저 자체 UI로 설치한 경우) 를 잡아내기 위함.
  if ('getInstalledRelatedApps' in navigator) {
    navigator.getInstalledRelatedApps().then((apps) => {
      if (apps && apps.length > 0) {
        try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
      }
    }).catch(() => {});
  }

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

    // getInstalledRelatedApps를 지원하는 브라우저는 클릭 시점에 한 번 더 실시간 확인
    // (위 사전 체크가 타이밍상 아직 안 끝났을 수 있어 이중 안전장치로 둠)
    if ('getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (apps && apps.length > 0) {
          try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
          alert('이미 설치가 되어있습니다. 지속 오류가 날 경우 삭제 후 재설치 해주세요.');
        } else {
          showManualInstallGuide();
        }
      }).catch(() => showManualInstallGuide());
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

  /* ---------------- 세션당 1회, 자동 바로가기 안내 ---------------- */
  // 조건: standalone 아님 + 아직 설치 안 함 + 지금 인앱 브라우저 안이 아님(그건
  // 오버레이가 따로 안내함) + 이번 세션에서 아직 안 보여줌.
  //
  // "설치 없이 닫음" 상태가 되면(TOPBAR_ACTIVE_KEY), 그 다음부턴 하단 넛지 대신
  // 상단에 작은 리마인드 배너가 페이지마다 계속 뜬다. 이것도 닫으면(두 번째
  // 거절) 그 세션 동안은 완전히 조용해진다. 세션이 끝나면(앱 완전 종료 후
  // 재실행) sessionStorage가 초기화되니 처음부터 다시 시작된다.
  const TOPBAR_ACTIVE_KEY = 'ntsdrive_shortcut_topbar_active';

  function maybeShowShortcutReminder() {
    if (isAlreadyInstalled()) return;
    if (typeof window !== 'undefined' && window.NTSInAppBrowser) return;

    let topbarActive = false;
    try { topbarActive = sessionStorage.getItem(TOPBAR_ACTIVE_KEY) === '1'; } catch (e) { /* ignore */ }
    if (topbarActive) {
      mountShortcutTopbar();
      return;
    }

    let nudgeShown = false;
    try { nudgeShown = sessionStorage.getItem(NUDGE_SHOWN_KEY) === '1'; } catch (e) { /* ignore */ }
    if (nudgeShown) return; // 이미 한 번 보여줬고, 아직 "닫음" 상태로 승격되지 않음(설치했거나 대기 중)
    try { sessionStorage.setItem(NUDGE_SHOWN_KEY, '1'); } catch (e) { /* ignore */ }
    mountShortcutNudge();
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
      // 두 번째 거절 — 이 세션 동안은 완전히 조용해진다.
      trackEventSafe('shortcut_topbar_dismissed');
      try { sessionStorage.removeItem(TOPBAR_ACTIVE_KEY); } catch (e) { /* ignore */ }
      el.remove();
    });
  }

  function mountShortcutNudge() {
    const style = document.createElement('style');
    style.textContent = `
      .nts-shortcut-nudge{position:fixed; left:16px; right:16px; bottom:16px; z-index:150; background:#17140F; color:#F7F3EC; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 8px 24px rgba(0,0,0,0.25);}
      .nts-shortcut-nudge span{flex:1; font-size:12.5px; line-height:1.5;}
      .nts-shortcut-nudge .nts-shortcut-go{flex-shrink:0; background:#F7F3EC; color:#17140F; border:none; border-radius:99px; padding:8px 14px; font-size:12px; font-weight:700; cursor:pointer;}
      .nts-shortcut-nudge .nts-shortcut-close{flex-shrink:0; background:none; border:none; color:#F7F3EC; opacity:0.7; font-size:14px; cursor:pointer; padding:4px;}
      @media (min-width:761px){ .nts-shortcut-nudge{left:auto; right:24px; bottom:24px; max-width:360px;} }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.className = 'nts-shortcut-nudge';
    el.innerHTML = `<span>홈 화면에 바로가기 추가하면 모든 기록을 한 곳에서 관리할 수 있어요</span><button type="button" class="nts-shortcut-go" id="ntsShortcutGo">추가하기</button><button type="button" class="nts-shortcut-close" id="ntsShortcutClose" aria-label="닫기">✕</button>`;
    document.body.appendChild(el);
    trackEventSafe('shortcut_nudge_shown');

    el.querySelector('#ntsShortcutGo').addEventListener('click', () => {
      trackEventSafe('shortcut_nudge_click');
      window.handleCreateShortcut();
      el.remove();
    });
    el.querySelector('#ntsShortcutClose').addEventListener('click', () => {
      // 설치 없이 닫음 — 다음 페이지부터는 상단 리마인드 배너로 전환(세션 한정)
      trackEventSafe('shortcut_nudge_dismissed');
      try { sessionStorage.setItem(TOPBAR_ACTIVE_KEY, '1'); } catch (e) { /* ignore */ }
      el.remove();
    });
  }

  if (document.body) maybeShowShortcutReminder();
  else document.addEventListener('DOMContentLoaded', maybeShowShortcutReminder);
})();
