/* ============================================================
   NTS Drive · Diary — shared.js
   데이터 스키마, localStorage 저장/조회, 주간 리포트 계산
   ============================================================ */

(function (global) {
  const STORAGE_KEY = 'ntsdrive.diary.entries.v1';
  const RESET_YEAR_KEY = 'ntsdrive.diary.resetYear.v1';
  const STORAGE_BUDGET_BYTES = 1 * 1024 * 1024;
  const MAX_TEXT_LENGTH = 20;

  /* ---------------- 감정 9종 (컬러 이모지, 3x3) ---------------- */
  const MOODS = [
    { id: 'joy',         label: '기쁨', emoji: '😊', color: '#FFF3B0', tone: 'positive' },
    { id: 'anger',       label: '분노', emoji: '🔥', color: '#FBC4B6', tone: 'negative' },
    { id: 'sad',         label: '슬픔', emoji: '😢', color: '#C6DEF1', tone: 'negative' },
    { id: 'anxious',     label: '불안', emoji: '😰', color: '#E8AEB7', tone: 'negative' },
    { id: 'annoyed',     label: '짜증', emoji: '😤', color: '#DBCDF0', tone: 'negative' },
    { id: 'shy',         label: '소심', emoji: '🙈', color: '#D6E2E9', tone: 'neutral'  },
    { id: 'envy',        label: '부럽', emoji: '👀', color: '#C9E4DE', tone: 'neutral'  },
    { id: 'bored',       label: '따분', emoji: '🥱', color: '#F2E9E1', tone: 'neutral'  },
    { id: 'embarrassed', label: '당황', emoji: '😳', color: '#FAEDCD', tone: 'negative' }
  ];

  /* ---------------- 원인 태그 ---------------- */
  const CAUSES = {
    '인간관계': ['상사', '후배', '가족', '친구', '여자친구', '남자친구', '선생님', '교수님', '선배', '나'],
    '일상/환경': ['돈', '날씨', '계획', '성과', '여행', '음식', '게임', '고백']
  };

  /* ---------------- 주간 리포트: 격려 문구 / 행동 가이드 ---------------- */
  const WEEKLY_MESSAGES = {
    joy:         { encourage: '이번 주는 유독 웃는 일이 많았네요. 그 기분, 오래 간직해요.' },
    anger:       { encourage: '화가 나는 순간들을 잘 버텨냈어요. 스스로를 다독여주세요.', guide: ['크게 소리 내어 심호흡하기', '가볍게 산책하며 머리 식히기', '좋아하는 음악 크게 듣기'] },
    sad:         { encourage: '마음이 많이 무거웠던 한 주였어요. 혼자 견디지 않아도 괜찮아요.', guide: ['좋아하는 맛집 방문하기', '따뜻한 차 한 잔 마시기', '가까운 친구에게 연락하기'] },
    anxious:     { encourage: '불안한 마음을 안고도 하루하루 잘 보내셨어요.', guide: ['짧은 산책으로 생각 정리하기', '오늘 할 일을 하나만 정해서 끝내기', '좋아하는 향의 차 마시기'] },
    annoyed:     { encourage: '짜증 나는 일들이 많았지만 잘 넘겼어요. 고생 많았어요.', guide: ['좋아하는 음식 배달시키기', '잠깐이라도 낮잠 자기', '스트레칭으로 몸 풀어주기'] },
    embarrassed: { encourage: '당황스러운 순간들도 결국 다 지나갔어요.', guide: ['편한 사람과 수다 떨기', '재밌는 영상 하나 보기'] },
    shy:         { encourage: '조심스러운 마음으로도 한 주를 잘 채워냈어요.' },
    envy:        { encourage: '부러운 마음이 들었다는 건, 나아가고 싶은 방향이 있다는 뜻이에요.' },
    bored:       { encourage: '무료했던 순간들 속에서도 하루하루를 채워왔어요.', guide: ['가보지 않은 동네 산책하기', '새로운 플레이리스트 만들기'] }
  };

  function todayStr(d) {
    const dt = d || new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getMood(id) { return MOODS.find(m => m.id === id) || null; }

  /* ---------------- 연간 리셋: 매년 1/1 00:00 기준 ---------------- */
  function applyYearlyReset() {
    const currentYear = new Date().getFullYear();
    const lastResetYear = parseInt(localStorage.getItem(RESET_YEAR_KEY) || '0', 10);
    if (lastResetYear < currentYear) {
      const entries = readAllRaw().filter(e => (e.date || '').slice(0, 4) === String(currentYear));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      localStorage.setItem(RESET_YEAR_KEY, String(currentYear));
      return true;
    }
    return false;
  }

  function readAllRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { console.error('diary readAll failed', e); return []; }
  }

  function readAll() { applyYearlyReset(); return readAllRaw(); }

  function writeAll(entries) {
    const json = JSON.stringify(entries);
    const approxBytes = json.length * 2;
    if (approxBytes > STORAGE_BUDGET_BYTES) {
      const trimmed = [...entries].sort((a, b) => a.createdAt - b.createdAt);
      while (trimmed.length && JSON.stringify(trimmed).length * 2 > STORAGE_BUDGET_BYTES) trimmed.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    localStorage.setItem(STORAGE_KEY, json);
    return entries;
  }

  function addEntry(entry) {
    if (!entry || !entry.mood || !getMood(entry.mood)) throw new Error('유효하지 않은 감정입니다.');
    const text = (entry.text || '').slice(0, MAX_TEXT_LENGTH);
    const record = {
      id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      date: entry.date || todayStr(),
      mood: entry.mood,
      causes: Array.isArray(entry.causes) ? entry.causes.slice(0, 3) : [],
      text, createdAt: Date.now(), v: 1
    };
    const entries = readAll();
    entries.push(record);
    writeAll(entries);
    return record;
  }

  function getEntries() { return readAll().sort((a, b) => b.createdAt - a.createdAt); }
  function getEntriesByDate(dateStr) { return readAll().filter(e => e.date === dateStr); }
  function deleteEntry(id) { writeAll(readAll().filter(e => e.id !== id)); }

  function getMondayOf(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return todayStr(d);
  }

  /** 동률일 경우 가장 최근에 기록된 감정을 우선시함 */
  function getWeeklyReport(anyDateInWeek) {
    const monday = getMondayOf(anyDateInWeek || todayStr());
    const mondayDate = new Date(monday + 'T00:00:00');
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);
    const sunday = todayStr(sundayDate);

    const weekEntries = readAll().filter(e => e.date >= monday && e.date <= sunday);
    const counts = {}, lastSeen = {};
    weekEntries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
      lastSeen[e.mood] = Math.max(lastSeen[e.mood] || 0, e.createdAt || 0);
    });

    const total = weekEntries.length;
    const ratios = MOODS.map(m => ({
      mood: m.id, label: m.label, emoji: m.emoji, color: m.color,
      count: counts[m.id] || 0, lastSeen: lastSeen[m.id] || 0,
      percent: total ? Math.round((counts[m.id] || 0) / total * 100) : 0
    })).filter(r => r.count > 0).sort((a, b) => (b.count - a.count) || (b.lastSeen - a.lastSeen));

    const top = ratios[0] || null;
    const msg = top ? (WEEKLY_MESSAGES[top.mood] || {}) : {};

    return {
      weekStart: monday, weekEnd: sunday, total, ratios, topMood: top,
      encourage: msg.encourage || (total ? '이번 주도 마음을 기록해줘서 고마워요.' : '이번 주는 아직 기록이 없어요.'),
      actionGuide: (top && (WEEKLY_MESSAGES[top.mood] || {}).guide) || null
    };
  }

  global.NTSDiary = {
    MOODS, CAUSES, MAX_TEXT_LENGTH,
    getMood, addEntry, getEntries, getEntriesByDate, deleteEntry,
    getWeeklyReport, getMondayOf, todayStr, applyYearlyReset
  };
})(window);
