/* ============================================================
   NTS Drive · Settings — 데이터 백업 / 가져오기(병합) / 자동 리마인드
   Post(post_inbox_v1), Log(log_mylogs_v1 + log_room:*), Diary
   (ntsdrive.diary.entries.v1 등)를 하나의 JSON으로 묶는다.
   사진(Snap/Film)은 용량 문제로 백업 대상에서 제외한다.
   ============================================================ */
(function (global) {
  const REMINDER_PREF_KEY = 'ntsdrive_backup_reminder_v1'; // {enabled, freq, lastBackupAt}
  const FREQ_MS = { daily: 1 * 24 * 60 * 60 * 1000, weekly: 7 * 24 * 60 * 60 * 1000, monthly: 30 * 24 * 60 * 60 * 1000 };

  function pad2(n) { return String(n).padStart(2, '0'); }

  function collectBackupData() {
    const data = {};

    // Post
    try { data['post_inbox_v1'] = JSON.parse(localStorage.getItem('post_inbox_v1') || '[]'); }
    catch (e) { data['post_inbox_v1'] = []; }

    // Log — 방 목록 + 방별 편지함을 전부 순회해서 모은다
    let mylogs = [];
    try { mylogs = JSON.parse(localStorage.getItem('log_mylogs_v1') || '[]'); } catch (e) { mylogs = []; }
    data['log_mylogs_v1'] = mylogs;
    const logRooms = {};
    mylogs.forEach(r => {
      if (!r.roomEncoded) return;
      try {
        const letters = JSON.parse(localStorage.getItem(`log_room:${r.roomEncoded}`) || '[]');
        logRooms[r.roomEncoded] = letters;
      } catch (e) { /* skip corrupted room */ }
    });
    data['log_rooms'] = logRooms;

    // Diary
    try { data['ntsdrive.diary.entries.v1'] = JSON.parse(localStorage.getItem('ntsdrive.diary.entries.v1') || '[]'); }
    catch (e) { data['ntsdrive.diary.entries.v1'] = []; }
    data['ntsdrive.diary.resetYear.v1'] = localStorage.getItem('ntsdrive.diary.resetYear.v1') || null;
    try { data['ntsdrive.diary.tagFreq.v1'] = JSON.parse(localStorage.getItem('ntsdrive.diary.tagFreq.v1') || '{}'); }
    catch (e) { data['ntsdrive.diary.tagFreq.v1'] = {}; }

    return data;
  }

  function downloadBackup() {
    const payload = { app: 'NTS Drive', version: 1, exportedAt: Date.now(), data: collectBackupData() };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const filename = `ntsdrive_backup_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}.json`;
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 리마인드 타이머 갱신(백업했으니 다음 주기부터 다시 카운트)
    const pref = getReminderPref();
    pref.lastBackupAt = Date.now();
    saveReminderPref(pref);
    return payload;
  }

  function mergeArrayByKey(existing, incoming, keyFn) {
    const seen = new Set(existing.map(keyFn));
    let added = 0;
    incoming.forEach(item => {
      const k = keyFn(item);
      if (!seen.has(k)) { existing.push(item); seen.add(k); added++; }
    });
    return added;
  }

  /** 가져온 백업 데이터를 기존 로컬 데이터와 "병합"한다 (덮어쓰지 않음). */
  function importBackup(payload) {
    if (!payload || !payload.data) throw new Error('올바른 백업 파일이 아니에요.');
    const d = payload.data;
    const summary = { post: 0, log: 0, diary: 0 };

    // Post
    try {
      const existing = JSON.parse(localStorage.getItem('post_inbox_v1') || '[]');
      const incoming = Array.isArray(d['post_inbox_v1']) ? d['post_inbox_v1'] : [];
      summary.post = mergeArrayByKey(existing, incoming, item => item.d);
      localStorage.setItem('post_inbox_v1', JSON.stringify(existing));
    } catch (e) { /* skip */ }

    // Log — 방 목록 병합 + 방별 편지 병합
    try {
      const existingRooms = JSON.parse(localStorage.getItem('log_mylogs_v1') || '[]');
      const incomingRooms = Array.isArray(d['log_mylogs_v1']) ? d['log_mylogs_v1'] : [];
      const addedRooms = mergeArrayByKey(existingRooms, incomingRooms, item => item.roomEncoded);
      localStorage.setItem('log_mylogs_v1', JSON.stringify(existingRooms));

      const incomingLetters = d['log_rooms'] || {};
      let addedLetters = 0;
      Object.keys(incomingLetters).forEach(re => {
        let existingLetters = [];
        try { existingLetters = JSON.parse(localStorage.getItem(`log_room:${re}`) || '[]'); } catch (e) { existingLetters = []; }
        addedLetters += mergeArrayByKey(existingLetters, incomingLetters[re], l => `${l.text}|${l.createdAt}`);
        localStorage.setItem(`log_room:${re}`, JSON.stringify(existingLetters));
      });
      summary.log = addedRooms + addedLetters;
    } catch (e) { /* skip */ }

    // Diary
    try {
      const existing = JSON.parse(localStorage.getItem('ntsdrive.diary.entries.v1') || '[]');
      const incoming = Array.isArray(d['ntsdrive.diary.entries.v1']) ? d['ntsdrive.diary.entries.v1'] : [];
      summary.diary = mergeArrayByKey(existing, incoming, item => item.id);
      localStorage.setItem('ntsdrive.diary.entries.v1', JSON.stringify(existing));

      // 태그 사용빈도는 합산
      const existingFreq = JSON.parse(localStorage.getItem('ntsdrive.diary.tagFreq.v1') || '{}');
      const incomingFreq = d['ntsdrive.diary.tagFreq.v1'] || {};
      Object.keys(incomingFreq).forEach(tag => {
        existingFreq[tag] = (existingFreq[tag] || 0) + incomingFreq[tag];
      });
      localStorage.setItem('ntsdrive.diary.tagFreq.v1', JSON.stringify(existingFreq));
      // resetYear는 로컬 값을 그대로 유지(가져온 값으로 덮어쓰지 않음)
    } catch (e) { /* skip */ }

    return summary;
  }

  /* ---------------- 자동 백업 리마인드 ---------------- */
  function getReminderPref() {
    try {
      const raw = localStorage.getItem(REMINDER_PREF_KEY);
      return raw ? JSON.parse(raw) : { enabled: false, freq: 'weekly', lastBackupAt: 0 };
    } catch (e) { return { enabled: false, freq: 'weekly', lastBackupAt: 0 }; }
  }
  function saveReminderPref(pref) {
    try { localStorage.setItem(REMINDER_PREF_KEY, JSON.stringify(pref)); } catch (e) { /* ignore */ }
  }

  /** 리마인드 조건 충족 시 배너를 보여줄지 여부와 경과일을 반환 */
  function checkReminderDue() {
    const pref = getReminderPref();
    if (!pref.enabled) return null;
    const intervalMs = FREQ_MS[pref.freq] || FREQ_MS.weekly;
    const last = pref.lastBackupAt || 0;
    const elapsed = Date.now() - last;
    if (elapsed < intervalMs) return null;
    const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return { days };
  }

  function snoozeReminder() {
    // "나중에"를 누르면 하루 뒤 다시 물어보도록 lastBackupAt을 살짝 당겨둔다
    // (완전히 끄는 게 아니라 다음 방문에도 계속 리마인드되게 하려는 목적)
    const pref = getReminderPref();
    const intervalMs = FREQ_MS[pref.freq] || FREQ_MS.weekly;
    pref.lastBackupAt = Date.now() - intervalMs + 24 * 60 * 60 * 1000;
    saveReminderPref(pref);
  }

  global.NTSBackup = {
    downloadBackup, importBackup, collectBackupData,
    getReminderPref, saveReminderPref, checkReminderDue, snoozeReminder
  };
})(window);
