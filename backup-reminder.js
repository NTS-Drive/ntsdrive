/* ============================================================
   NTS Drive · 백업 리마인드 배너
   - Post 편지함 / Log 로그함 / Diary 감정기록을 합산해서 일정 개수 이상
     쌓이면, "잃어버리기 전에 백업해두라"는 가벼운 배너를 노출한다.
   - 한 번 닫으면 영구적으로 다시 안 뜬다.
   - 편지함/로그함/감정기록 페이지에서만 사용(mount 함수를 직접 호출).
   ============================================================ */
(function () {
  const DISMISS_KEY = 'ntsdrive_backup_reminder_dismissed_v1';
  const THRESHOLD = 5;

  function countKey(key) {
    try {
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.length : 0;
    } catch (e) { return 0; }
  }

  function totalContentCount() {
    return countKey('post_inbox_v1') + countKey('log_mylogs_v1') + countKey('ntsdrive.diary.entries.v1');
  }

  function isDismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function trackEventSafe(name, params) {
    try { if (typeof trackEvent === 'function') trackEvent(name, params || {}); } catch (e) { /* ignore */ }
  }

  window.NTSBackupReminder = {
    mount: function (containerId, settingsUrl) {
      if (isDismissed()) return;
      if (totalContentCount() < THRESHOLD) return;
      const container = document.getElementById(containerId);
      if (!container) return;

      const style = document.createElement('style');
      style.textContent = `
        .nts-backup-reminder{display:flex; align-items:center; gap:10px; background:#FFFDF9; border:1px solid #E4DDD0; border-radius:12px; padding:12px 14px; margin-bottom:16px; font-size:12.5px; color:#17140F; line-height:1.5;}
        .nts-backup-reminder .nts-backup-btn{flex-shrink:0; background:#17140F; color:#fff; border:none; border-radius:99px; padding:7px 14px; font-size:12px; font-weight:600; cursor:pointer;}
        .nts-backup-reminder .nts-backup-close{flex-shrink:0; background:none; border:none; color:#6B6459; font-size:13px; cursor:pointer; padding:4px;}
      `;
      document.head.appendChild(style);

      const el = document.createElement('div');
      el.className = 'nts-backup-reminder';
      el.innerHTML = `<span>기록이 꽤 쌓였네요. 잃어버리지 않게 지금 백업해둘까요?</span><button type="button" class="nts-backup-btn" id="ntsBackupGo">지금 백업하기</button><button type="button" class="nts-backup-close" id="ntsBackupClose" aria-label="닫기">✕</button>`;
      container.insertBefore(el, container.firstChild);
      trackEventSafe('content_backup_nudge_shown');

      el.querySelector('#ntsBackupGo').addEventListener('click', () => {
        trackEventSafe('content_backup_nudge_click');
        window.location.href = settingsUrl;
      });
      el.querySelector('#ntsBackupClose').addEventListener('click', () => {
        trackEventSafe('content_backup_nudge_dismissed');
        dismiss();
        el.remove();
      });
    }
  };
})();
