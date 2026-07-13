/* ============================================================
   NTS Drive · 공용 "바로가기 생성" (PWA 설치) 로직
   index.html, post/inbox.html, log/mylogs.html, diary/*.html 에서 공통 사용
   ============================================================ */
(function () {
  const INSTALLED_KEY = 'ntsdrive_pwa_installed';

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

    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
    let alreadyInstalled = isStandalone;
    try { alreadyInstalled = alreadyInstalled || localStorage.getItem(INSTALLED_KEY) === '1'; } catch (e) {}

    if (alreadyInstalled) {
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
})();
