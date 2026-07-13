/* ============================================================
   NTS Drive · 공용 "바로가기 생성" (PWA 설치) 로직
   index.html, post/inbox.html, log/mylogs.html, diary/*.html 에서 공통 사용
   ============================================================ */
(function () {
  const INSTALLED_KEY = 'ntsdrive_pwa_installed';

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

    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
    let alreadyInstalled = isStandalone;
    try { alreadyInstalled = alreadyInstalled || localStorage.getItem(INSTALLED_KEY) === '1'; } catch (e) {}

    if (alreadyInstalled) {
      alert('이미 설치가 되어있습니다. 지속 오류가 날 경우 삭제 후 재설치 해주세요.');
      return;
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (isIOS) {
      alert('이 기기에서는 자동으로 만들 수 없어요.\n\nSafari 하단의 공유 버튼(⬆️)을 누르고,\n"홈 화면에 추가"를 선택해주세요.');
    } else {
      alert('브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요.\n(브라우저 우측 상단 메뉴 또는 주소창 아이콘에서 찾으실 수 있어요.)');
    }
  };
})();
