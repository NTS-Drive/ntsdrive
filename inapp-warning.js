/* ============================================================
   NTS Drive · 인앱 브라우저(카카오톡/네이버/인스타그램) 감지 배너
   - 카카오톡 등 메신저 앱 안의 웹뷰는 평소 쓰는 브라우저와 저장공간이
     완전히 분리되어 있어, 그 안에서 "내 편지함에 등록"이나 "D-day 추가"를
     눌러도 나중에 사파리/크롬으로 다시 들어오면 안 보이는 문제가 있다.
   - User-Agent로 이를 감지해서, 페이지 최상단(내비게이션 위)에 짧은
     안내 배너를 노출한다. 세션 내에서 닫으면 다시 뜨지 않는다.
   ============================================================ */
(function () {
  function detectInAppBrowser() {
    const ua = navigator.userAgent || '';
    if (/KAKAOTALK/i.test(ua)) return { id: 'kakao', name: '카카오톡', menu: '우측 상단 "···" 메뉴' };
    if (/NAVER\(/i.test(ua)) return { id: 'naver', name: '네이버 앱', menu: '하단 메뉴(≡ 또는 •••)' };
    if (/Instagram/i.test(ua)) return { id: 'instagram', name: '인스타그램', menu: '우측 상단 "···" 메뉴' };
    return null;
  }

  const app = detectInAppBrowser();
  if (!app) return;

  try {
    if (sessionStorage.getItem('ntsdrive_inapp_banner_dismissed') === '1') return;
  } catch (e) { /* ignore */ }

  function mount() {
    const style = document.createElement('style');
    style.textContent = `
      .nts-inapp-banner{background:#17140F; color:#F7F3EC; padding:10px 16px; font-size:12.5px; line-height:1.5; display:flex; align-items:center; gap:10px; position:relative; z-index:70;}
      .nts-inapp-banner b{font-weight:700;}
      .nts-inapp-banner .nts-inapp-close{margin-left:auto; flex-shrink:0; cursor:pointer; font-size:14px; padding:2px 6px; opacity:0.75; background:none; border:none; color:inherit;}
      @media (min-width:761px){ .nts-inapp-banner{font-size:13px; justify-content:center; text-align:center;} .nts-inapp-banner .nts-inapp-close{position:absolute; right:16px; margin-left:0;} }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.className = 'nts-inapp-banner';
    el.innerHTML = `<span><b>${app.name}</b> 안에서는 저장한 내용이 평소 쓰는 브라우저와 연결되지 않아요. ${app.menu}에서 "다른 브라우저로 열기"를 눌러주세요.</span><button type="button" class="nts-inapp-close" aria-label="닫기">✕</button>`;
    document.body.insertBefore(el, document.body.firstChild);

    el.querySelector('.nts-inapp-close').addEventListener('click', () => {
      el.remove();
      try { sessionStorage.setItem('ntsdrive_inapp_banner_dismissed', '1'); } catch (e) { /* ignore */ }
    });

    try { if (typeof trackEvent === 'function') trackEvent('inapp_browser_banner_shown', { app: app.id }); } catch (e) { /* ignore */ }
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
