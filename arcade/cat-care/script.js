/* ===== Constants ===== */
const SAVE_KEY_TODAY = 'cc_today';
const NAME_HISTORY_KEY = 'cc_name_history';

const START_WINDOW_MIN = 8 * 60 + 40;  // 08:40
const START_WINDOW_MAX = 9 * 60 + 20;  // 09:20
const END_MINUTE = 18 * 60;            // 18:00
const GRACE_MIN = 30;
const MIN_EVENTS = 6;
const MAX_EVENTS = 8;
const NAME_HISTORY_DAYS = 7;

const CAT_NAMES = [
  '나비', '콩이', '두부', '미미', '몽이', '초코', '보리', '라떼', '마루', '봄이',
  '하늘이', '구름이', '별이', '솜이', '딸기', '젤리', '코코', '뭉치', '요미', '치즈',
  '참깨', '우유', '꿀떡', '앙꼬', '자두', '망고'
];

const EVENT_META = {
  food:   { emoji: '🍗', label: '밥',     actionLabel: '밥 주기',       prompt: n => `${n}가 배고파해요!` },
  litter: { emoji: '🧹', label: '화장실', actionLabel: '화장실 치워주기', prompt: n => `${n}의 화장실을 치워줄 시간이에요.` },
  play:   { emoji: '🧶', label: '놀이',   actionLabel: '놀아주기',       prompt: n => `${n}가 같이 놀고 싶어해요!` }
};

const MISS_START_MESSAGE = '오늘은 오전에 많이 바쁘셨나봐요. 내일 같은 시간에 다시 기다리고 있을게요 🐱';

/* 집사 기분 10종 — 클릭 시 고양이가 랜덤으로 말풍선 답변 (항상 사람을 위로하는 톤 유지) */
const MOODS = [
  { key: 'happy', emoji: '😊', label: '기뻐요' },
  { key: 'sad', emoji: '😔', label: '슬퍼요' },
  { key: 'angry', emoji: '😤', label: '화나요' },
  { key: 'tired', emoji: '😩', label: '피곤해요' },
  { key: 'anxious', emoji: '😰', label: '불안해요' },
  { key: 'bored', emoji: '🥱', label: '심심해요' },
  { key: 'calm', emoji: '😌', label: '평온해요' },
  { key: 'moved', emoji: '🥹', label: '뭉클해요' },
  { key: 'exhausted', emoji: '😵', label: '지쳤어요' },
  { key: 'excited', emoji: '🤩', label: '설레요' }
];

const MOOD_REPLIES = {
  happy: [
    '우와, {이름}도 덩달아 신났어요! 야옹~',
    '좋은 일이 있었나 봐요! 저도 꼬리를 흔들게요.',
    '그 기분 그대로 오래 갔으면 좋겠어요!',
    '히히, 저도 같이 기뻐요!',
    '오늘 표정이 제일 좋아 보여요!'
  ],
  sad: [
    '괜찮아요, 제가 옆에 있어드릴게요.',
    '힘든 날엔 그냥 저를 한번 쓰다듬어주세요.',
    '오늘은 마음이 좀 무거우신가 봐요. 저라도 곁에 있을게요.',
    '울고 싶으면 울어도 돼요, 저는 아무한테도 말 안 해요.',
    '다 지나갈 거예요. 저도 응원할게요.'
  ],
  angry: [
    '많이 답답하셨나 봐요. 심호흡 한 번 어때요?',
    '저를 한번 쓰다듬으면 화가 조금 풀릴지도 몰라요.',
    '그럴 수도 있죠. 오늘은 그냥 넘어가요.',
    '화날 땐 화나는 거예요. 참지 않아도 돼요.',
    '저는 언제나 주인님 편이에요.'
  ],
  tired: [
    '오늘 정말 애쓰셨어요. 잠깐 눈 좀 붙이는 거 어때요?',
    '고생하셨어요, 조금만 더 버텨봐요.',
    '저도 하품 나와요... 같이 쉬어요.',
    '무리하지 마세요, 저는 언제든 기다릴 수 있어요.',
    '오늘 하루도 참 길었죠.'
  ],
  anxious: [
    '괜찮아요, 천천히 숨 쉬어봐요.',
    '제가 옆에 있으니까 조금은 안심해도 돼요.',
    '다 잘 될 거예요, 너무 걱정하지 마세요.',
    '불안할 땐 잠깐 멈춰도 괜찮아요.',
    '제 골골송 들려드릴까요? 조금은 편해질 거예요.'
  ],
  bored: [
    '저랑 잠깐 놀아요! 심심함은 제 전문이에요.',
    '지루한 하루엔 저를 한번 보러 오세요.',
    '저도 방금까지 심심했어요, 우리 통했네요.',
    '잠깐 딴생각 좀 해도 괜찮아요.',
    '심심할 땐 창밖 한번 보는 것도 좋아요.'
  ],
  calm: [
    '그 평온함, 저한테도 좀 나눠주세요.',
    '좋은 상태네요, 오래 유지되길 바라요.',
    '저도 지금 딱 이 기분이에요.',
    '이런 순간이 참 소중하죠.',
    '평화로운 하루, 잘 어울려요.'
  ],
  moved: [
    '무슨 일인지는 몰라도, 그 마음 알 것 같아요.',
    '그런 날도 있는 거예요, 마음 편히 가지세요.',
    '저도 괜히 마음이 따뜻해지네요.',
    '가끔은 그렇게 뭉클해도 괜찮아요.',
    '오늘 그 감정, 소중히 간직하세요.'
  ],
  exhausted: [
    '정말 많이 지치셨나 봐요. 오늘은 여기까지만 해요.',
    '지칠 땐 잠깐 멈추는 것도 용기예요.',
    '저도 오늘 하루 종일 주인님 기다리느라 힘들었어요, 우리 같이 쉬어요.',
    '무리하지 않으셔도 돼요, 이미 충분히 잘하셨어요.',
    '오늘은 일찍 쉬는 게 어때요?'
  ],
  excited: [
    '무슨 좋은 일 있나요? 저도 궁금해요!',
    '그 설렘, 오래오래 가져가세요!',
    '덩달아 저도 두근두근해요!',
    '좋은 예감이 드는 하루네요!',
    '그 기분 그대로 하루를 보내보세요!'
  ]
};

const PHRASES = {
  low: {
    opening: [
      '오늘 많이 힘드셨죠?', '오늘 하루도 고생 많으셨어요.', '여러모로 신경 쓸 게 많으셨죠?',
      '오늘따라 유독 정신없으셨죠?', '오늘 참 길게 느껴지는 하루였죠?', '오늘 진짜 고생하셨어요.',
      '정신없는 하루, 잘 버텨내셨어요.', '오늘은 유독 지치는 하루였네요.', '마음 쓸 일이 많으셨나 봐요.',
      '긴 하루였어요, 그렇죠?'
    ],
    body: [
      '주인님도 집에 가셔서 푹 쉬세요.', '오늘은 일찍 잠자리에 드는 거 어때요?', '따뜻한 걸 좀 드시고 쉬세요.',
      '오늘만큼은 아무 생각 말고 쉬세요.', '좋아하는 걸 하면서 마음 좀 풀어주세요.', '잠깐이라도 여유를 가지셨으면 해요.',
      '오늘 하루는 여기까지, 이제 쉬셔도 돼요.', '몸도 마음도 잠시 내려놓으세요.', '오늘은 스스로를 좀 챙겨주세요.',
      '편하게 저녁 시간 보내세요.'
    ],
    closing: [
      '내일 만나요 🐱', '{이름}이가 기다리고 있을게요.', '천천히 오세요.', '내일은 조금 더 여유롭길 바라요.',
      '푹 쉬고 내일 봐요 🐾', '{이름}이도 응원하고 있어요.', '오늘 하루도 정말 수고 많으셨어요.',
      '내일 또 만나요, 주인님.', '좋은 밤 보내세요 🌙', '다음에 또 봐요 😺'
    ]
  },
  mid: {
    opening: [
      '오늘 하루도 무사히 지나갔네요.', '{이름}랑 오늘 함께해주셔서 고마워요.', '바쁜 와중에도 잘 챙겨주셨어요.',
      '오늘 하루도 알차게 보내셨네요.', '{이름}와 좋은 하루 보내셨어요.', '오늘도 열심히 지내셨네요.',
      '하루가 금방 지나갔죠?', '오늘 하루도 잘 흘러갔네요.', '{이름}도 오늘 하루 즐거웠나 봐요.',
      '오늘도 무사히 하루를 마쳤네요.'
    ],
    body: [
      '{이름}이 보면서 내일도 힘내세요!', '내일은 조금 더 여유 있으시길 바라요.', '이 정도면 충분히 잘하고 계세요.',
      '내일도 오늘처럼만 하면 될 것 같아요.', '{이름}도 오늘 하루 나쁘지 않았대요.', '조금씩 나아지고 있어요.',
      '오늘 페이스, 딱 좋아요.', '무리하지 않아도 충분해요.', '지금처럼만 하면 충분해요.',
      '{이름}도 편안한 하루를 보냈어요.'
    ],
    closing: [
      '좋은 저녁 보내세요 🐾', '오늘도 수고하셨어요.', '내일 또 봐요 😊', '편안한 밤 되세요.',
      '{이름}이 내일도 기다릴게요.', '오늘 하루 감사했어요.', '다음에 또 만나요.', '좋은 하루 마무리하세요.',
      '내일 뵐게요 🐱', '편히 쉬세요.'
    ]
  },
  high: {
    opening: [
      '{이름}를 정말 잘 케어해주셨어요!', '오늘 최고의 집사였어요!', '{이름}가 오늘 완전 신났어요!',
      '오늘 하루, 완벽한 케어였어요!', '{이름}가 오늘 최고로 행복한 하루를 보냈어요!', '대단해요, 오늘 정말 잘 챙겨주셨어요!',
      '{이름}가 오늘 하루종일 웃고 있었어요!', '오늘의 주인공은 바로 주인님이에요!', '{이름}가 오늘 아주 만족스러워해요!',
      '완벽 그 자체인 하루였어요!'
    ],
    body: [
      '{이름}가 오늘 정말 행복해했어요.', '{이름}가 하루종일 신났나 봐요.', '이런 날이 {이름}에게 최고의 하루예요.',
      '{이름}가 오늘을 오래 기억할 것 같아요.', '{이름}도 오늘 같은 하루를 좋아해요.', '오늘처럼만 하면 {이름}는 걱정 없어요.',
      '{이름}가 세상 편안한 표정이에요.', '오늘 하루, {이름}에게 완벽했어요.', '{이름}가 오늘 제일 좋아하는 하루였어요.',
      '이보다 더 좋을 순 없는 하루였어요.'
    ],
    closing: [
      '이제 집에 가서 더 즐거운 시간을 보내세요 💛', '오늘 같은 하루 또 있었으면 좋겠어요.', '정말 수고 많으셨어요, 내일 또 봐요!',
      '오늘 하루 최고였어요 🎉', '내일도 이렇게 함께해요!', '{이름}가 내일도 기대하고 있을게요.',
      '오늘의 완벽한 하루, 축하드려요!', '편안하고 즐거운 저녁 보내세요.', '이런 하루라면 언제든 환영이에요.',
      '내일도 좋은 하루 되세요 😻'
    ]
  }
};

/* ===== Utilities ===== */
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function nowMinutes(d = new Date()) { return d.getHours() * 60 + d.getMinutes(); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function isWeekend(d = new Date()) { const day = d.getDay(); return day === 0 || day === 6; }

/* ===== Name history (7-day no-repeat) ===== */
function loadNameHistory() {
  try { return JSON.parse(localStorage.getItem(NAME_HISTORY_KEY) || '[]'); }
  catch (e) { return []; }
}
function pruneNameHistory(list) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NAME_HISTORY_DAYS);
  return list.filter(e => new Date(e.date) >= cutoff);
}
function isNameRecentlyUsed(name) {
  const list = pruneNameHistory(loadNameHistory());
  return list.some(e => e.name === name);
}
function recordNameUsed(name) {
  let list = pruneNameHistory(loadNameHistory());
  list.push({ name, date: todayStr() });
  localStorage.setItem(NAME_HISTORY_KEY, JSON.stringify(list));
}
function randomAvailableName() {
  const used = new Set(pruneNameHistory(loadNameHistory()).map(e => e.name));
  const pool = CAT_NAMES.filter(n => !used.has(n));
  const source = pool.length > 0 ? pool : CAT_NAMES;
  return pick(source);
}

/* ===== Today's game persistence ===== */
function loadTodayGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY_TODAY) || 'null');
    if (data && data.date === todayStr()) return data;
    return null;
  } catch (e) { return null; }
}
function saveTodayGame(game) {
  localStorage.setItem(SAVE_KEY_TODAY, JSON.stringify(game));
}

/* ===== Event scheduling ===== */
const MIN_GAP_MIN = 40;

function generateEvents(startMinutes) {
  const count = Math.floor(Math.random() * (MAX_EVENTS - MIN_EVENTS + 1)) + MIN_EVENTS;
  const available = END_MINUTE - startMinutes - 20; // buffer before 18:00
  const minSpan = (count - 1) * MIN_GAP_MIN;
  const slackTotal = Math.max(0, available - minSpan);

  // Stick-breaking: distribute the leftover slack randomly across count+1
  // gaps, then add the fixed 40-min minimum on top of each internal gap.
  // (An earlier per-segment-jitter approach could place two events as
  // close as ~10 minutes apart — verified failing in simulation — this
  // approach guarantees the minimum gap by construction.)
  const weights = Array.from({ length: count + 1 }, () => Math.random());
  const wSum = weights.reduce((a, b) => a + b, 0);
  const slacks = weights.map(w => (w / wSum) * slackTotal);

  const types = [];
  const base = ['food', 'litter', 'play'];
  while (types.length < count) types.push(...base);
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  const events = [];
  let cursor = slacks[0];
  for (let i = 0; i < count; i++) {
    if (i > 0) cursor += MIN_GAP_MIN + slacks[i];
    events.push({ time: Math.round(startMinutes + cursor), type: types[i], status: 'pending' });
  }
  return events;
}

function refreshStatuses(game) {
  const now = nowMinutes();
  game.events.forEach(e => {
    if (e.status === 'pending' && now > e.time + GRACE_MIN) {
      e.status = 'missed';
    }
  });
}

function findActionableEvent(game) {
  const now = nowMinutes();
  return game.events.find(e => e.status === 'pending' && now >= e.time && now <= e.time + GRACE_MIN);
}

/* ===== Result ===== */
function computeTier(game) {
  const total = game.events.length;
  const success = game.events.filter(e => e.status === 'success').length;
  const rate = total === 0 ? 0 : (success / total) * 100;
  if (rate < 40) return 'low';
  if (rate < 80) return 'mid';
  return 'high';
}
function buildResultMessage(tier, name) {
  const p = PHRASES[tier];
  const line = `${pick(p.opening)} ${pick(p.body)} ${pick(p.closing)}`;
  return line.replace(/\{이름\}/g, name);
}

/* ===== Rendering ===== */
const frame = document.getElementById('canvasFrame');
const footerNote = document.getElementById('footerNote');
const moodPanel = document.getElementById('moodPanel');
const moodGrid = document.getElementById('moodGrid');
const moodBubble = document.getElementById('moodBubble');
let moodGridBuilt = false;
let currentCatName = '';

function buildMoodGridOnce() {
  if (moodGridBuilt) return;
  moodGrid.innerHTML = MOODS.map(m => `
    <button class="mood-btn" onclick="handleMoodClick('${m.key}')">
      <span class="mood-emoji">${m.emoji}</span>
      <span class="mood-label">${m.label}</span>
    </button>
  `).join('');
  moodGridBuilt = true;
}

function setMoodPanelVisible(visible, catName) {
  if (visible) {
    currentCatName = catName || currentCatName;
    buildMoodGridOnce();
    moodPanel.style.display = 'block';
  } else {
    moodPanel.style.display = 'none';
    moodBubble.style.display = 'none';
  }
}

function handleMoodClick(moodKey) {
  const pool = MOOD_REPLIES[moodKey];
  if (!pool) return;
  const reply = pick(pool).replace(/\{이름\}/g, currentCatName || '고양이');
  moodBubble.textContent = reply;
  moodBubble.style.display = 'none';
  void moodBubble.offsetWidth; // restart animation on repeated clicks
  moodBubble.style.display = 'block';
}

function render() {
  const now = new Date();
  footerNote.textContent = '';

  if (isWeekend(now)) {
    renderWeekend();
    setMoodPanelVisible(false);
    return;
  }

  const game = loadTodayGame();

  if (game) {
    setMoodPanelVisible(true, game.catName);
    if (game.completed) {
      renderResult(game);
    } else {
      refreshStatuses(game);
      saveTodayGame(game);
      if (nowMinutes(now) >= END_MINUTE) {
        finishDay(game);
      } else {
        renderPlay(game);
      }
    }
    return;
  }

  setMoodPanelVisible(false);
  const mins = nowMinutes(now);
  if (mins >= START_WINDOW_MIN && mins <= START_WINDOW_MAX) {
    renderStart();
  } else {
    renderMissedStart();
  }
}

function renderWeekend() {
  frame.innerHTML = `
    <div class="gate-emoji">😽</div>
    <div class="gate-message">고양이는 주말엔 쉬어요.<br>월요일 아침에 다시 만나요.</div>
  `;
}

function renderMissedStart() {
  frame.innerHTML = `
    <div class="gate-emoji">😿</div>
    <div class="gate-message">${MISS_START_MESSAGE}</div>
  `;
}

function renderStart() {
  const suggested = randomAvailableName();
  frame.innerHTML = `
    <div class="cat-face">🐱</div>
    <div class="status-line">오늘 함께할 고양이의 이름을 지어주세요.<br>(최근 7일 안에 쓴 이름은 다시 쓸 수 없어요)</div>
    <div class="name-input-row">
      <input type="text" id="nameInput" class="name-input" maxlength="8" placeholder="${suggested}" value="${suggested}">
      <button class="dice-btn" onclick="rerollName()" title="다른 이름 추천">🎲</button>
    </div>
    <div class="name-error" id="nameError"></div>
    <button class="big-btn" onclick="handleStart()">오늘 하루 시작하기</button>
  `;
}

function rerollName() {
  const input = document.getElementById('nameInput');
  input.value = randomAvailableName();
  document.getElementById('nameError').textContent = '';
}

function handleStart() {
  const input = document.getElementById('nameInput');
  const name = input.value.trim();
  const errorEl = document.getElementById('nameError');

  if (!name) { errorEl.textContent = '이름을 입력해주세요.'; return; }
  if (name.length > 8) { errorEl.textContent = '이름은 8자 이내로 지어주세요.'; return; }
  if (isNameRecentlyUsed(name)) {
    errorEl.textContent = '최근 7일 안에 사용한 이름이에요. 다른 이름을 지어주세요.';
    return;
  }

  const mins = nowMinutes();
  if (mins < START_WINDOW_MIN || mins > START_WINDOW_MAX) {
    // Time window closed while the user was typing.
    render();
    return;
  }

  const game = {
    date: todayStr(),
    catName: name,
    startMinutes: mins,
    events: generateEvents(mins),
    completed: false
  };
  recordNameUsed(name);
  saveTodayGame(game);
  toast(`${name}와(과) 함께하는 하루가 시작됐어요!`);
  render();
}

function renderPlay(game) {
  const actionable = findActionableEvent(game);
  const successCount = game.events.filter(e => e.status === 'success').length;

  const timelineHtml = game.events.map(e => {
    const meta = EVENT_META[e.type];
    return `<div class="timeline-dot ${e.status}">${e.status === 'missed' ? '💤' : meta.emoji}</div>`;
  }).join('');

  if (actionable) {
    const meta = EVENT_META[actionable.type];
    frame.innerHTML = `
      <div class="cat-face bounce" id="catFace">😺</div>
      <div class="cat-name">${game.catName}</div>
      <div class="event-card">
        <div class="event-emoji">${meta.emoji}</div>
        <div class="event-prompt">${meta.prompt(game.catName)}</div>
        <button class="big-btn" onclick="respondToEvent(${game.events.indexOf(actionable)})">${meta.actionLabel}</button>
      </div>
      <div class="timeline">${timelineHtml}</div>
    `;
  } else {
    frame.innerHTML = `
      <div class="cat-face" id="catFace">😌</div>
      <div class="cat-name">${game.catName}</div>
      <div class="status-line">지금은 평온한 시간이에요.<br>오늘 ${successCount}번 챙겨줬어요.</div>
      <div class="timeline">${timelineHtml}</div>
    `;
  }
  footerNote.textContent = '오후 6시에 오늘 하루가 마무리돼요.';
}

function respondToEvent(index) {
  const game = loadTodayGame();
  if (!game) return;
  const e = game.events[index];
  if (!e || e.status !== 'pending') { render(); return; }

  const now = nowMinutes();
  if (now > e.time + GRACE_MIN) {
    e.status = 'missed';
  } else {
    e.status = 'success';
  }
  saveTodayGame(game);
  render();
}

function finishDay(game) {
  const tier = computeTier(game);
  game.completed = true;
  game.resultMessage = buildResultMessage(tier, game.catName);
  saveTodayGame(game);
  renderResult(game);
}

function renderResult(game) {
  frame.innerHTML = `
    <div class="cat-face">🐾</div>
    <div class="cat-name">${game.catName}와(과) 보낸 하루</div>
    <div class="result-message">${game.resultMessage}</div>
  `;
  footerNote.textContent = '내일 아침 8시 40분~9시 20분에 다시 만나요.';
}

/* ===== Guide & toast ===== */
function openGuide() { document.getElementById('guide-overlay').style.display = 'flex'; }
function closeGuide() { document.getElementById('guide-overlay').style.display = 'none'; }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ===== Boot ===== */
render();
setInterval(render, 15000); // periodic re-check while the tab stays open
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
