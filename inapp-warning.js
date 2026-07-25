/* ============================================================
   NTS Drive · 인앱 브라우저(카카오톡/인스타그램) 대응 — 단순화 버전
   - 어떤 페이지로 들어오든, 인앱 브라우저가 감지되면 진입 즉시 전체화면
     오버레이 하나만 노출한다 (예전의 "상단 배너 + iOS 전용 인터스티셜"
     이중 구조를 오버레이 하나로 통합).
   - 안드로이드: "주 브라우저로 이동" 버튼 1개(핵심 경로). intent://로 크롬
     이동을 시도하고, 실패하면 토스트 + 복사 폴백(액션플랜 포함)으로 전환.
   - 아이폰: "링크 복사하기"(복사 직후 단계별 액션플랜 노출) + "이동 없이
     둘러보기"(세션 동안만 다시 안 뜸) 2개 버튼.
   - Post의 "편지 확인 링크"(?d=)로 들어온 경우, 이동시킬 URL을 "내 편지함
     등록 링크"(?add=)로 바꿔치기해서 크롬/사파리 도착과 동시에 자동 저장까지
     한 번에 끝나게 한다. Log는 애초에 회신 링크 자체가 ?add= 형태라 이
     처리가 필요 없다(기본 동작 그대로 사용).
   ============================================================ */
(function () {
  // 이 스크립트는 <head>에서 가장 먼저 실행되므로, 페이지 자체 로직(예: Log의
  // ?add= 처리 후 history.replaceState로 주소를 조용히 정리하는 동작)이 URL을
  // 바꾸기 "이전"의 원본 주소를 여기서 붙잡아둔다. 나중에 오버레이 버튼을
  // 눌렀을 때 이 원본 값을 쓰면, 그 사이에 주소가 바뀌었어도 영향을 안 받는다.
  const ORIGINAL_URL = window.location.href;

  function detectApp() {
    const ua = navigator.userAgent || '';
    if (/KAKAOTALK/i.test(ua)) return { id: 'kakao', name: '카카오톡', escapeIcon: '↑', escapeMenu: '공유 아이콘', escapeLocation: '화면 하단', escapeAction: '"Safari로 열기"' };
    if (/Instagram/i.test(ua)) return { id: 'instagram', name: '인스타그램', escapeIcon: '•••', escapeMenu: '메뉴', escapeLocation: '화면 우측 상단', escapeAction: '"외부 브라우저에서 열기"' };
    return null;
  }
  function detectOS() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'other';
  }

  const app = detectApp();
  window.NTSInAppBrowser = app; // 다른 스크립트(Post/Log 저장 로직 등)에서도 참조
  if (!app) return;

  const os = detectOS();

  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params || {}); } catch (e) { /* ignore */ }
  }

  // Post의 편지 확인 링크(?d=)라면 "내 편지함 등록" 링크(?add=)로 바꿔서
  // 돌려준다. 그 외(Log의 ?add= 링크 등)는 지금 URL을 그대로 돌려준다.
  function resolveTargetUrl() {
    const url = new URL(ORIGINAL_URL);
    const isPostPage = /\/post\//.test(url.pathname);
    const dParam = url.searchParams.get('d');
    if (isPostPage && dParam) {
      const inboxUrl = new URL(url.pathname.replace(/index\.html$/, 'inbox.html'), url.origin);
      inboxUrl.searchParams.set('add', dParam);
      return inboxUrl.toString();
    }
    return url.toString();
  }

  function showManualCopyPrompt(url) {
    try { window.prompt('링크를 자동으로 복사하지 못했어요. 아래 텍스트를 길게 눌러 전체 선택한 뒤 복사해주세요.', url); }
    catch (e) { /* 더 이상 할 수 있는 게 없음 */ }
  }

  function copyText(url, onDone) {
    const done = (ok) => { trackEventSafe('inapp_link_copied', { app: app.id, os, ok }); onDone(ok); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => done(true)).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      try {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) showManualCopyPrompt(url);
        done(ok);
      } catch (e) { showManualCopyPrompt(url); done(false); }
    }
  }

  let toastTimer = null;
  function showToast(msg, actionLabel, actionFn) {
    let el = document.getElementById('ntsInappToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ntsInappToast';
      el.className = 'nts-inapp-toast';
      document.body.appendChild(el);
    }
    el.innerHTML = actionLabel
      ? `<span>${msg}</span><button type="button" class="nts-toast-action" id="ntsToastAction">${actionLabel}</button>`
      : msg;
    el.classList.add('show');
    if (actionLabel && actionFn) {
      const btn = document.getElementById('ntsToastAction');
      if (btn) btn.addEventListener('click', () => { el.classList.remove('show'); actionFn(); });
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 6000);
  }

  // 안드로이드: intent:// 로 크롬 이동 시도. 처음 실패하면 "다시 시도" 버튼을
  // 보여주고, 유저가 눌러서 한 번 더 시도했는데도 또 실패하면 그때 복사
  // 폴백으로 넘어간다.
  function attemptAndroidRedirect(isRetry) {
    trackEventSafe('inapp_redirect_attempt', { app: app.id, os, retry: !!isRetry });
    const target = resolveTargetUrl();
    const noProto = target.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${noProto}#Intent;scheme=https;package=com.android.chrome;end`;
    let left = false;
    document.addEventListener('visibilitychange', function onVis() {
      if (document.hidden) left = true;
    }, { once: true });
    window.location.href = intentUrl;
    setTimeout(() => {
      if (left) {
        trackEventSafe('inapp_redirect_success', { app: app.id, retry: !!isRetry });
        return;
      }
      trackEventSafe('inapp_redirect_failed', { app: app.id, retry: !!isRetry });
      if (!isRetry) {
        showToast('자동 이동에 실패했어요.', '다시 시도', () => attemptAndroidRedirect(true));
        return;
      }
      copyText(target, (ok) => {
        showToast(ok
          ? '자동 이동에 실패해서 링크를 복사했어요. ① 크롬 앱 열기 → ② 주소창에 붙여넣기 → ③ 이동해주세요.'
          : '자동 이동에 실패했어요. 주소를 직접 복사해서 크롬 주소창에 붙여넣어주세요.');
      });
    }, 2500);
  }

  // Post/Log의 인라인 버튼("클릭하면 지금 이 브라우저에 바로 등록돼요",
  // "내 방으로 이동하기")에서도 재사용한다. 게이트를 닫고 인앱에 남은 유저를
  // 위한 보조 안전장치 역할.
  window.ntsSmartNavigate = function (url) {
    const abs = new URL(url, window.location.href).toString();
    if (os === 'android') {
      trackEventSafe('inapp_redirect_attempt', { app: app.id, os, source: 'inline_action' });
      const absNoProto = abs.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${absNoProto}#Intent;scheme=https;package=com.android.chrome;end`;
      let left = false;
      document.addEventListener('visibilitychange', function onVis() {
        if (document.hidden) left = true;
      }, { once: true });
      window.location.href = intentUrl;
      setTimeout(() => {
        if (left) {
          trackEventSafe('inapp_redirect_success', { app: app.id, source: 'inline_action' });
        } else {
          trackEventSafe('inapp_redirect_failed', { app: app.id, source: 'inline_action' });
          copyText(abs, (ok) => {
            showToast(ok
              ? '자동 이동에 실패해서 링크를 복사했어요. ① 크롬 앱 열기 → ② 주소창에 붙여넣기 → ③ 이동해주세요.'
              : '자동 이동에 실패했어요. 주소를 직접 복사해서 크롬 주소창에 붙여넣어주세요.');
          });
        }
      }, 2500);
    } else {
      copyText(abs, (ok) => {
        showToast(ok
          ? '링크를 복사했어요. ① 사파리 앱 열기 → ② 주소창에 붙여넣기 → ③ 이동해주세요.'
          : '복사에 실패했어요. 주소를 직접 복사해서 사파리 주소창에 붙여넣어주세요.');
      });
    }
  };

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nts-gate-overlay{position:fixed; inset:0; background:rgba(15,13,10,0.72); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px;}
      .nts-gate-card{position:relative; background:#FFFDF9; border-radius:20px; padding:32px 24px; max-width:360px; width:100%; text-align:center; font-family:'Inter',sans-serif;}
      .nts-gate-icon{font-size:34px; margin-bottom:14px;}
      .nts-gate-card h3{font-size:16px; font-weight:700; color:#17140F; margin-bottom:8px; line-height:1.4;}
      .nts-gate-card p{font-size:12.5px; color:#6B6459; line-height:1.6; margin-bottom:0;}
      .nts-gate-primary{width:100%; margin-top:18px; padding:13px; border-radius:10px; border:none; background:#17140F; color:#fff; font-size:14px; font-weight:600; cursor:pointer;}
      .nts-gate-caption{margin-top:8px; font-size:11px;}
      .nts-gate-escape{margin-top:18px; padding:16px; background:#F1E3E1; border-radius:14px; display:flex; align-items:center; gap:12px; text-align:left;}
      .nts-gate-escape-icon{flex-shrink:0; width:38px; height:38px; border-radius:10px; background:#FFFDF9; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#7A4A32;}
      .nts-gate-escape p{font-size:12px; color:#7A4A32; line-height:1.6; margin:0;}
      .nts-gate-or{margin-top:14px; font-size:11px; color:#B5A890;}
      .nts-gate-secondary{width:100%; margin-top:10px; padding:12px; border-radius:10px; border:1px solid #E4DDD0; background:transparent; color:#17140F; font-size:13.5px; font-weight:600; cursor:pointer;}
      .nts-gate-steps{margin-top:14px; padding:12px 14px; background:#F1E3E1; border-radius:10px; font-size:12px; color:#7A4A32; text-align:left; line-height:1.9; display:none;}
      .nts-gate-steps.show{display:block;}
      .nts-gate-dismiss{width:100%; margin-top:14px; padding:8px; border-radius:10px; border:none; background:transparent; color:#B5A890; font-size:12px; cursor:pointer; text-decoration:underline;}
      .nts-gate-close{position:absolute; top:10px; right:14px; background:none; border:none; font-size:15px; color:#B5A890; cursor:pointer; padding:6px;}

      .nts-inapp-toast{position:fixed; top:16px; left:50%; transform:translateX(-50%); max-width:calc(100vw - 48px); background:#17140F; color:#fff; padding:12px 18px; border-radius:14px; font-size:12.5px; line-height:1.6; text-align:center; z-index:999; opacity:0; pointer-events:none; transition:opacity .3s ease; display:flex; align-items:center; gap:10px;}
      .nts-inapp-toast.show{opacity:1; pointer-events:auto;}
      .nts-toast-action{flex-shrink:0; background:#F7F3EC; color:#17140F; border:none; border-radius:99px; padding:6px 12px; font-size:11.5px; font-weight:700; cursor:pointer;}
    `;
    document.head.appendChild(style);
  }

  function mountGate() {
    const el = document.createElement('div');
    el.className = 'nts-gate-overlay';
    el.id = 'ntsGateOverlay';

    const androidButtons = `
      <button type="button" class="nts-gate-primary" id="ntsGateAndroidGo">주 브라우저로 이동</button>
      <button type="button" class="nts-gate-close" id="ntsGateClose" aria-label="닫기">✕</button>
    `;
    const iosButtons = `
      <div class="nts-gate-escape">
        <div class="nts-gate-escape-icon">${app.escapeIcon}</div>
        <p><b>${app.escapeLocation}의 ${app.escapeMenu}</b>(${app.escapeIcon})을 누르고<br>${app.escapeAction}를 선택하면 바로 사파리로 이동해요<br><span style="opacity:0.75;">(제일 쉽고 빠른 방법이에요)</span></p>
      </div>
      <div class="nts-gate-or">또는</div>
      <button type="button" class="nts-gate-secondary" id="ntsGateCopy">링크 복사하기</button>
      <div class="nts-gate-steps" id="ntsGateSteps">① 복사 완료 ✓<br>② 사파리 앱 열기<br>③ 주소창에 붙여넣기<br>④ 이동</div>
      <button type="button" class="nts-gate-dismiss" id="ntsGateDismiss">그냥 읽기만 할게요</button>
    `;

    el.innerHTML = `
      <div class="nts-gate-card">
        <div class="nts-gate-icon">🔒</div>
        <h3>${app.name} 안에서는 이용이 제한돼요</h3>
        <p>저장·공유가 정상적으로 안 돼요. 주 사용 브라우저(사파리 또는 크롬)로 이동해야 온전히 이용할 수 있어요.</p>
        ${os === 'android' ? androidButtons : iosButtons}
      </div>`;
    document.body.appendChild(el);
    trackEventSafe('inapp_gate_shown', { app: app.id, os });

    if (os === 'android') {
      el.querySelector('#ntsGateAndroidGo').addEventListener('click', attemptAndroidRedirect);
      el.querySelector('#ntsGateClose').addEventListener('click', () => {
        trackEventSafe('inapp_gate_dismissed', { app: app.id, os });
        el.remove();
      });
    } else {
      el.querySelector('#ntsGateCopy').addEventListener('click', () => {
        const target = resolveTargetUrl();
        copyText(target, (ok) => {
          const btn = document.getElementById('ntsGateCopy');
          if (btn) btn.textContent = ok ? '복사했어요 ✓' : '복사에 실패했어요';
          if (ok) {
            const steps = document.getElementById('ntsGateSteps');
            if (steps) steps.classList.add('show');
          }
        });
      });
      el.querySelector('#ntsGateDismiss').addEventListener('click', () => {
        trackEventSafe('inapp_gate_dismissed', { app: app.id, os });
        el.remove();
      });
    }
  }

  function mount() {
    injectStyles();
    // 아이폰/안드로이드 둘 다 매번(페이지 이동마다) 다시 뜬다. "그냥 읽기만
    // 할게요"를 선택해도 어차피 저장·촬영·방만들기 등 대부분 기능이 막혀있어서
    // "읽기 전용 모드"가 실질적 의미가 없고, 계속 안내해서 실제로 이동하도록
    // 유도하는 게 더 낫다고 판단해 세션 억제를 없앴다.
    mountGate();
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
