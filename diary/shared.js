/* ============================================================
   NTS Drive · Diary — shared.js
   데이터 스키마, localStorage 저장/조회, 주간 리포트 계산
   ============================================================ */

(function (global) {
  const STORAGE_KEY = 'ntsdrive.diary.entries.v1';
  // Diary는 텍스트 전용이라 부담이 적음 — Snap/Film의 2MB 카메라 예산과는
  // 완전히 분리된 자체 예산. 우선 넉넉하게 1MB로 설정.
  const STORAGE_BUDGET_BYTES = 1 * 1024 * 1024;
  const MAX_TEXT_LENGTH = 20;

  /* ---------------- 감정 10종 (커스텀 픽토그램, line-icon 스타일) ---------------- */
  const MOODS = [
    { id: 'joy',         label: '기쁨', color: '#FFF3B0', tone: 'positive',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 10.5c.4-.6.9-.9 1.4-.9M14.6 9.6c.5 0 1 .3 1.4.9"/><path d="M8 14c1.1 1.4 2.5 2.1 4 2.1s2.9-.7 4-2.1"/></svg>' },
    { id: 'anger',       label: '분노', color: '#FBC4B6', tone: 'negative',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.8l2.3.9M16.5 9.8l-2.3.9"/><path d="M8.5 16c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5"/></svg>' },
    { id: 'sad',         label: '슬픔', color: '#C6DEF1', tone: 'negative',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9.3" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14.7" cy="10.5" r=".9" fill="currentColor" stroke="none"/><path d="M8.5 16.3c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5"/><path d="M15.2 12.3c.7.6 1 1.6.7 2.6"/></svg>' },
    { id: 'anxious',     label: '불안', color: '#E8AEB7', tone: 'negative',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9.3" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14.7" cy="10.5" r=".9" fill="currentColor" stroke="none"/><path d="M8.5 15.5q1-1 2-.4t1.3.9q.3-1.3 1.3-.9t2 .4"/></svg>' },
    { id: 'annoyed',     label: '짜증', color: '#DBCDF0', tone: 'negative',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8" y1="10.2" x2="10.4" y2="10.2"/><line x1="13.6" y1="10.2" x2="16" y2="10.2"/><path d="M8.5 15.5h3l-1.5 1.5 1.5 1.5h-3"/></svg>' },
    { id: 'shy',         label: '소심', color: '#D6E2E9', tone: 'neutral',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8.3" y1="10.6" x2="10.3" y2="10.6"/><line x1="13.7" y1="10.6" x2="15.7" y2="10.6"/><path d="M10 15.6h4"/><circle cx="7.8" cy="13.2" r="1" fill="currentColor" stroke="none" opacity=".5"/><circle cx="16.2" cy="13.2" r="1" fill="currentColor" stroke="none" opacity=".5"/></svg>' },
    { id: 'envy',        label: '부럽', color: '#C9E4DE', tone: 'neutral',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9.3" cy="10.5" r="1.3"/><circle cx="14.7" cy="10.5" r="1.3"/><path d="M9.5 15.7c.8.6 1.6.9 2.5.9s1.7-.3 2.5-.9"/></svg>' },
    { id: 'bored',       label: '따분', color: '#F2E9E1', tone: 'neutral',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8" y1="10.5" x2="10.4" y2="10.5"/><line x1="13.6" y1="10.5" x2="16" y2="10.5"/><line x1="8.5" y1="15.8" x2="15.5" y2="15.8"/></svg>' },
    { id: 'embarrassed', label: '당황', color: '#FAEDCD', tone: 'negative',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9.3" cy="10.3" r="1.1"/><circle cx="14.7" cy="10.3" r="1.1"/><circle cx="12" cy="16" r="1.6"/><path d="M16.5 12.5q.8.6.6 1.8" opacity=".6"/></svg>' },
    { id: 'love',        label: '사랑', color: '#FFCAD4', tone: 'positive',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.3 9.6c.6-.5 1.5-.4 1.9.2l.1.2.1-.2c.4-.6 1.3-.7 1.9-.2.6.5.6 1.4 0 2l-2 2-2-2c-.6-.6-.6-1.5 0-2z" fill="currentColor" stroke="none"/><path d="M8.5 16c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2"/></svg>' }
  ];

  /* ---------------- 원인 태그 (원본 기획서 항목 재사용) ---------------- */
  const CAUSES = {
    '인간관계': ['상사', '후배', '가족', '친구', '여자친구', '남자친구'],
    '일상/환경': ['돈', '날씨', '계획', '성과', '업무', '여행', '음식', '게임']
  };

  /* ---------------- 주간 리포트: 격려 문구 / 행동 가이드 ---------------- */
  const WEEKLY_MESSAGES = {
    joy:         { encourage: '이번 주는 유독 웃는 일이 많았네요. 그 기분, 오래 간직해요.' },
    love:        { encourage: '마음을 나누는 순간들로 채워진 한 주였어요. 참 다행이에요.' },
    anger:       { encourage: '화가 나는 순간들을 잘 버텨냈어요. 스스로를 다독여주세요.', guide: ['크게 소리 내어 심호흡하기', '가볍게 산책하며 머리 식히기', '좋아하는 음악 크게 듣기'] },
    sad:         { encourage: '마음이 많이 무거웠던 한 주였어요. 혼자 견디지 않아도 괜찮아요.', guide: ['좋아하는 맛집 방문하기', '따뜻한 차 한 잔 마시기', '가까운 친구에게 연락하기'] },
    anxious:     { encourage: '불안한 마음을 안고도 하루하루 잘 보내셨어요.', guide: ['짧은 산책으로 생각 정리하기', '오늘 할 일을 하나만 정해서 끝내기', '좋아하는 향의 차 마시기'] },
    annoyed:     { encourage: '짜증 나는 일들이 많았지만 잘 넘겼어요. 고생 많았어요.', guide: ['좋아하는 음식 배달시키기', '잠깐이라도 낮잠 자기', '스트레칭으로 몸 풀어주기'] },
    embarrassed: { encourage: '당황스러운 순간들도 결국 다 지나갔어요.', guide: ['편한 사람과 수다 떨기', '재밌는 영상 하나 보기'] },
    shy:         { encourage: '조심스러운 마음으로도 한 주를 잘 채워냈어요.' },
    envy:        { encourage: '부러운 마음이 들었다는 건, 나아가고 싶은 방향이 있다는 뜻이에요.' },
    bored:       { encourage: '무료했던 순간들 속에서도 하루하루를 채워왔어요.', guide: ['가보지 않은 동네 산책하기', '새로운 플레이리스트 만들기'] }
  };

  /* ---------------- 유틸 ---------------- */
  function todayStr(d) {
    const dt = d || new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getMood(id) {
    return MOODS.find(m => m.id === id) || null;
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('diary readAll failed', e);
      return [];
    }
  }

  function writeAll(entries) {
    const json = JSON.stringify(entries);
    // 대략적인 바이트 사이즈 체크 (UTF-16 기준 근사치)
    const approxBytes = json.length * 2;
    if (approxBytes > STORAGE_BUDGET_BYTES) {
      // 예산 초과 시 가장 오래된 항목부터 제거
      const trimmed = [...entries].sort((a, b) => a.createdAt - b.createdAt);
      while (trimmed.length && JSON.stringify(trimmed).length * 2 > STORAGE_BUDGET_BYTES) {
        trimmed.shift();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    localStorage.setItem(STORAGE_KEY, json);
    return entries;
  }

  /**
   * 새 감정 기록 저장
   * @param {{mood:string, causes:string[], text?:string, date?:string}} entry
   */
  function addEntry(entry) {
    if (!entry || !entry.mood || !getMood(entry.mood)) {
      throw new Error('유효하지 않은 감정입니다.');
    }
    const text = (entry.text || '').slice(0, MAX_TEXT_LENGTH);
    const record = {
      id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      date: entry.date || todayStr(),
      mood: entry.mood,
      causes: Array.isArray(entry.causes) ? entry.causes.slice(0, 3) : [],
      text,
      createdAt: Date.now(),
      v: 1
    };
    const entries = readAll();
    entries.push(record);
    writeAll(entries);
    return record;
  }

  function getEntries() {
    return readAll().sort((a, b) => b.createdAt - a.createdAt);
  }

  function getEntriesByDate(dateStr) {
    return readAll().filter(e => e.date === dateStr);
  }

  function deleteEntry(id) {
    const entries = readAll().filter(e => e.id !== id);
    writeAll(entries);
  }

  /** 해당 날짜가 속한 주의 월요일 날짜(YYYY-MM-DD)를 반환 */
  function getMondayOf(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0=일 ... 6=토
    const diff = (day === 0 ? -6 : 1 - day); // 월요일로 이동
    d.setDate(d.getDate() + diff);
    return todayStr(d);
  }

  /**
   * 주간 리포트 계산 (월~일 기준)
   * @param {string} [anyDateInWeek] 해당 주에 속한 아무 날짜 (기본값: 오늘)
   */
  function getWeeklyReport(anyDateInWeek) {
    const monday = getMondayOf(anyDateInWeek || todayStr());
    const mondayDate = new Date(monday + 'T00:00:00');
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);
    const sunday = todayStr(sundayDate);

    const weekEntries = readAll().filter(e => e.date >= monday && e.date <= sunday);

    const counts = {};
    weekEntries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });

    const total = weekEntries.length;
    const ratios = MOODS.map(m => ({
      mood: m.id, label: m.label, color: m.color,
      count: counts[m.id] || 0,
      percent: total ? Math.round((counts[m.id] || 0) / total * 100) : 0
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

    const top = ratios[0] || null;
    const msg = top ? (WEEKLY_MESSAGES[top.mood] || {}) : {};

    return {
      weekStart: monday,
      weekEnd: sunday,
      total,
      ratios,
      topMood: top,
      encourage: msg.encourage || (total ? '이번 주도 마음을 기록해줘서 고마워요.' : '이번 주는 아직 기록이 없어요.'),
      // 부정적 감정이 1위일 때만 행동 가이드 노출
      actionGuide: (top && (WEEKLY_MESSAGES[top.mood] || {}).guide) || null
    };
  }

  global.NTSDiary = {
    MOODS, CAUSES, MAX_TEXT_LENGTH,
    getMood, addEntry, getEntries, getEntriesByDate, deleteEntry,
    getWeeklyReport, getMondayOf, todayStr
  };
})(window);
