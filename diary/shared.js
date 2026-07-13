/* ============================================================
   NTS Drive · Diary — shared.js
   데이터 스키마, localStorage 저장/조회, 주간 리포트 계산
   ============================================================ */

(function (global) {
  const STORAGE_KEY = 'ntsdrive.diary.entries.v1';
  const RESET_YEAR_KEY = 'ntsdrive.diary.resetYear.v1';
  const TAG_FREQ_KEY = 'ntsdrive.diary.tagFreq.v1';
  const STORAGE_BUDGET_BYTES = 1 * 1024 * 1024;
  const MAX_TEXT_LENGTH = 20;
  const MAX_CAUSES = 3;

  /* ---------------- 감정 9종 (컬러 이모지, 3x3, 긍정→중립→부정 순) ---------------- */
  const MOODS = [
    { id: 'joy',      label: '기쁨',   emoji: '😊', color: '#FFF3B0', tone: 'positive' },
    { id: 'excited',  label: '설렘',   emoji: '🥰', color: '#FFCAD4', tone: 'positive' },
    { id: 'proud',    label: '뿌듯함', emoji: '🥹', color: '#C9E4DE', tone: 'positive' },
    { id: 'embarrassed', label: '당황', emoji: '😳', color: '#FAEDCD', tone: 'neutral'  },
    { id: 'bored',    label: '지루',   emoji: '🥱', color: '#F2E9E1', tone: 'neutral'  },
    { id: 'anger',    label: '분노',   emoji: '🔥', color: '#FBC4B6', tone: 'negative' },
    { id: 'annoyed',  label: '짜증',   emoji: '😤', color: '#DBCDF0', tone: 'negative' },
    { id: 'sad',      label: '슬픔',   emoji: '😢', color: '#C6DEF1', tone: 'negative' },
    { id: 'anxious',  label: '불안',   emoji: '😰', color: '#E8AEB7', tone: 'negative' }
  ];

  /* ---------------- 원인 태그: 4개 카테고리 (고정 순서·색상, 긍정→중립→부정 순) ---------------- */
  const CAUSE_GROUPS = [
    { id: 'relation', label: '관계', color: '#F2A88C',
      tags: ['새로운 만남', '연인', '친구', '가족', '동료·선후배', '갈등'] },
    { id: 'achieve', label: '성취·학업', color: '#8CB6E8',
      tags: ['성과', '도전', '시험·발표', '마감', '실패', '번아웃'] },
    { id: 'self', label: '컨디션·자기자신', color: '#8FC9A8',
      tags: ['성취감', '컨디션', '비교', '피로', '수면부족'] },
    { id: 'daily', label: '일상·환경', color: '#E8C07A',
      tags: ['서프라이즈', '여행', '휴식', '기념일', '날씨', '돈'] }
  ];
  // 이전 버전 호환용 평면 목록 (그룹명: 태그배열)
  const CAUSES = CAUSE_GROUPS.reduce((acc, g) => { acc[g.label] = g.tags; return acc; }, {});

  /* ---------------- 주간 리포트: 톤(tier)별 응원 문구 + 감정별 제안 문구 ---------------- */
  const TIER_MESSAGES = {
    celebrate: [
      '이번 주는 유난히 반짝였어요.',
      '좋은 기운이 가득했던 한 주였어요. 그 기분 오래 간직해요.',
      '웃는 일이 많았던 한 주네요. 스스로를 칭찬해줘요.'
    ],
    plain: [
      '잔잔한 하루들이 쌓여서 한 주가 됐어요.',
      '오르내림이 있는 한 주였지만, 잘 지나왔어요.',
      '평범한 하루들도 소중하게 잘 채워왔어요.'
    ],
    comfort: [
      '쉽지 않은 순간들 속에서도, 하루하루를 놓치지 않고 남겨왔어요.',
      '많이 힘들었을 한 주예요. 그래도 잘 버텨냈어요.',
      '지치는 날들이었을 텐데, 고생 많았어요.'
    ]
  };

  const MOOD_GUIDE_MESSAGES = {
    anger:       ['크게 소리 내어 심호흡하기', '가볍게 산책하며 머리 식히기', '좋아하는 음악 크게 듣기'],
    sad:         ['좋아하는 맛집 방문하기', '따뜻한 차 한 잔 마시기', '가까운 친구에게 연락하기'],
    anxious:     ['짧은 산책으로 생각 정리하기', '오늘 할 일을 하나만 정해서 끝내기', '좋아하는 향의 차 마시기'],
    annoyed:     ['좋아하는 음식 배달시키기', '잠깐이라도 낮잠 자기', '스트레칭으로 몸 풀어주기'],
    embarrassed: ['편한 사람과 수다 떨기', '재밌는 영상 하나 보기'],
    bored:       ['가보지 않은 동네 산책하기', '새로운 플레이리스트 만들기']
  };

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

  /* ---------------- 태그 사용 빈도 (자주 쓰는 태그) ---------------- */
  function bumpTagFrequency(tags) {
    if (!tags || !tags.length) return;
    let freq = {};
    try { freq = JSON.parse(localStorage.getItem(TAG_FREQ_KEY) || '{}'); } catch (e) { freq = {}; }
    tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    try { localStorage.setItem(TAG_FREQ_KEY, JSON.stringify(freq)); } catch (e) { /* ignore */ }
  }

  function getFrequentTags(limit) {
    let freq = {};
    try { freq = JSON.parse(localStorage.getItem(TAG_FREQ_KEY) || '{}'); } catch (e) { freq = {}; }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 3)
      .map(([tag]) => tag);
  }

  function addEntry(entry) {
    if (!entry || !entry.mood || !getMood(entry.mood)) throw new Error('유효하지 않은 감정입니다.');
    const text = (entry.text || '').slice(0, MAX_TEXT_LENGTH);
    const causes = Array.isArray(entry.causes) ? entry.causes.slice(0, MAX_CAUSES) : [];
    const record = {
      id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      date: entry.date || todayStr(),
      mood: entry.mood,
      causes,
      text, createdAt: Date.now(), v: 2
    };
    const entries = readAll();
    entries.push(record);
    writeAll(entries);
    bumpTagFrequency(causes);
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

  /**
   * 그날의 "대표 감정"(최빈값)을 계산. 동률이면 가장 최근에 기록된 감정 우선.
   */
  function getDominantMood(dayEntries) {
    if (!dayEntries || !dayEntries.length) return null;
    const counts = {}, lastSeen = {};
    dayEntries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
      lastSeen[e.mood] = Math.max(lastSeen[e.mood] || 0, e.createdAt || 0);
    });
    const sorted = Object.keys(counts).sort((a, b) => (counts[b] - counts[a]) || (lastSeen[b] - lastSeen[a]));
    return getMood(sorted[0]);
  }

  /**
   * 주간 리포트
   * - 응원 문구: 긍정 vs (중립+부정) 비율로 3단계 톤 결정 (감정 종류 무관)
   *   · 긍정 ≥ 중립+부정            → celebrate
   *   · 중립+부정이 더 많지만 60% 미만 → plain
   *   · 중립+부정이 전체의 60% 이상   → comfort
   * - 제안 문구: 중립+부정 > 긍정일 때만, 그 주 최빈 감정 기준 (동률은 최근 기록 우선)
   */
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
      mood: m.id, label: m.label, emoji: m.emoji, color: m.color, tone: m.tone,
      count: counts[m.id] || 0, lastSeen: lastSeen[m.id] || 0,
      percent: total ? Math.round((counts[m.id] || 0) / total * 100) : 0
    })).filter(r => r.count > 0).sort((a, b) => (b.count - a.count) || (b.lastSeen - a.lastSeen));

    const positiveCount = weekEntries.filter(e => (getMood(e.mood) || {}).tone === 'positive').length;
    const negNeuCount = total - positiveCount;
    const negNeuRatio = total ? negNeuCount / total : 0;

    let tier = 'celebrate';
    if (total > 0) {
      if (negNeuCount > positiveCount) {
        tier = negNeuRatio >= 0.6 ? 'comfort' : 'plain';
      } else {
        tier = 'celebrate';
      }
    }

    const encourage = total ? pick(TIER_MESSAGES[tier]) : '이번 주는 아직 기록이 없어요.';

    const top = ratios[0] || null;
    let actionGuide = null;
    if (total > 0 && negNeuCount > positiveCount && top && MOOD_GUIDE_MESSAGES[top.mood]) {
      const pool = MOOD_GUIDE_MESSAGES[top.mood];
      // 최대 3개까지, 매번 순서 섞어서 다양하게
      actionGuide = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    }

    return {
      weekStart: monday, weekEnd: sunday, total, ratios, topMood: top, tier,
      encourage, actionGuide
    };
  }

  global.NTSDiary = {
    MOODS, CAUSES, CAUSE_GROUPS, MAX_TEXT_LENGTH, MAX_CAUSES,
    getMood, addEntry, getEntries, getEntriesByDate, deleteEntry,
    getWeeklyReport, getMondayOf, todayStr, applyYearlyReset,
    getFrequentTags, getDominantMood
  };
})(window);
