const SAVE_KEY = 'cm_save_v2';
const LEADERBOARD_KEY = 'cm_leaderboard';
const BEST_STREAK_KEY = 'cm_best_streak';

const PREVIEW_DURATIONS = [5000, 4000, 3000, 2000, 0]; // ms, indexed by stage — Stage 5 has no preview
const MISMATCH_MS = 900;
const BASE_POINTS = 10;
const MAX_MULT = 2.0;
const PERFECT_BONUS = 20;
const HINT_REVEAL_MS = 4000;
const TIME_LIMITS = [10, 8, 7, 6, 5]; // seconds to flip the 2nd card, indexed by stage

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',        lives: 5 },
  manager:  { label: 'Manager (Normal)',     lives: 3 },
  director: { label: 'Director (Difficult)', lives: 2 }
};

/* ===== Pools: ~40 items per level, 10 drawn at random each run ===== */
const ANIMALS_EASY = [
  { word: 'Dog', emoji: '🐶' }, { word: 'Cat', emoji: '🐱' }, { word: 'Mouse', emoji: '🐭' }, { word: 'Hamster', emoji: '🐹' },
  { word: 'Rabbit', emoji: '🐰' }, { word: 'Fox', emoji: '🦊' }, { word: 'Bear', emoji: '🐻' }, { word: 'Panda', emoji: '🐼' },
  { word: 'Koala', emoji: '🐨' }, { word: 'Tiger', emoji: '🐯' }, { word: 'Lion', emoji: '🦁' }, { word: 'Cow', emoji: '🐮' },
  { word: 'Pig', emoji: '🐷' }, { word: 'Frog', emoji: '🐸' }, { word: 'Monkey', emoji: '🐵' }, { word: 'Chicken', emoji: '🐔' },
  { word: 'Penguin', emoji: '🐧' }, { word: 'Bird', emoji: '🐦' }, { word: 'Duck', emoji: '🦆' }, { word: 'Eagle', emoji: '🦅' },
  { word: 'Owl', emoji: '🦉' }, { word: 'Bat', emoji: '🦇' }, { word: 'Wolf', emoji: '🐺' }, { word: 'Horse', emoji: '🐴' },
  { word: 'Unicorn', emoji: '🦄' }, { word: 'Bee', emoji: '🐝' }, { word: 'Butterfly', emoji: '🦋' }, { word: 'Snail', emoji: '🐌' },
  { word: 'Ladybug', emoji: '🐞' }, { word: 'Ant', emoji: '🐜' }, { word: 'Turtle', emoji: '🐢' }, { word: 'Snake', emoji: '🐍' },
  { word: 'Fish', emoji: '🐟' }, { word: 'Shark', emoji: '🦈' }, { word: 'Dolphin', emoji: '🐬' }, { word: 'Whale', emoji: '🐳' },
  { word: 'Crocodile', emoji: '🐊' }, { word: 'Elephant', emoji: '🐘' }, { word: 'Giraffe', emoji: '🦒' }, { word: 'Kangaroo', emoji: '🦘' }
];
const ANIMALS_NORMAL = [
  { word: 'Ox', emoji: '🐂' }, { word: 'Water Buffalo', emoji: '🐃' }, { word: 'Ram', emoji: '🐏' }, { word: 'Ewe', emoji: '🐑' },
  { word: 'Goat', emoji: '🐐' }, { word: 'Deer', emoji: '🦌' }, { word: 'Poodle', emoji: '🐩' }, { word: 'Rooster', emoji: '🐓' },
  { word: 'Turkey', emoji: '🦃' }, { word: 'Dove', emoji: '🕊️' }, { word: 'Parrot', emoji: '🦜' }, { word: 'Swan', emoji: '🦢' },
  { word: 'Peacock', emoji: '🦚' }, { word: 'Flamingo', emoji: '🦩' }, { word: 'Sloth', emoji: '🦥' }, { word: 'Otter', emoji: '🦦' },
  { word: 'Skunk', emoji: '🦨' }, { word: 'Badger', emoji: '🦡' }, { word: 'Raccoon', emoji: '🦝' }, { word: 'Hedgehog', emoji: '🦔' },
  { word: 'Chipmunk', emoji: '🐿️' }, { word: 'Llama', emoji: '🦙' }, { word: 'Bison', emoji: '🦬' }, { word: 'Mammoth', emoji: '🦣' },
  { word: 'Beaver', emoji: '🦫' }, { word: 'Dodo', emoji: '🦤' }, { word: 'Seal', emoji: '🦭' }, { word: 'Orangutan', emoji: '🦧' },
  { word: 'Gorilla', emoji: '🦍' }, { word: 'Rhinoceros', emoji: '🦏' }, { word: 'Hippopotamus', emoji: '🦛' }, { word: 'Camel', emoji: '🐫' },
  { word: 'Zebra', emoji: '🦓' }, { word: 'Leopard', emoji: '🐆' }, { word: 'Boar', emoji: '🐗' }, { word: 'Octopus', emoji: '🐙' },
  { word: 'Squid', emoji: '🦑' }, { word: 'Crab', emoji: '🦀' }, { word: 'Lizard', emoji: '🦎' }, { word: 'Scorpion', emoji: '🦂' }
];
const FLAGS_NORMAL = [
  { word: 'France', emoji: '🇫🇷' }, { word: 'Japan', emoji: '🇯🇵' }, { word: 'USA', emoji: '🇺🇸' }, { word: 'Brazil', emoji: '🇧🇷' },
  { word: 'Germany', emoji: '🇩🇪' }, { word: 'Italy', emoji: '🇮🇹' }, { word: 'Canada', emoji: '🇨🇦' }, { word: 'China', emoji: '🇨🇳' },
  { word: 'Korea', emoji: '🇰🇷' }, { word: 'UK', emoji: '🇬🇧' }, { word: 'Spain', emoji: '🇪🇸' }, { word: 'Mexico', emoji: '🇲🇽' },
  { word: 'India', emoji: '🇮🇳' }, { word: 'Russia', emoji: '🇷🇺' }, { word: 'Australia', emoji: '🇦🇺' }, { word: 'Egypt', emoji: '🇪🇬' },
  { word: 'South Africa', emoji: '🇿🇦' }, { word: 'Switzerland', emoji: '🇨🇭' }, { word: 'Netherlands', emoji: '🇳🇱' }, { word: 'Sweden', emoji: '🇸🇪' },
  { word: 'Norway', emoji: '🇳🇴' }, { word: 'Ireland', emoji: '🇮🇪' }, { word: 'Portugal', emoji: '🇵🇹' }, { word: 'Greece', emoji: '🇬🇷' },
  { word: 'Turkey', emoji: '🇹🇷' }, { word: 'Thailand', emoji: '🇹🇭' }, { word: 'Indonesia', emoji: '🇮🇩' }, { word: 'Philippines', emoji: '🇵🇭' },
  { word: 'Vietnam', emoji: '🇻🇳' }, { word: 'Saudi Arabia', emoji: '🇸🇦' }, { word: 'UAE', emoji: '🇦🇪' }, { word: 'Israel', emoji: '🇮🇱' },
  { word: 'Poland', emoji: '🇵🇱' }, { word: 'Austria', emoji: '🇦🇹' }, { word: 'Belgium', emoji: '🇧🇪' }, { word: 'Denmark', emoji: '🇩🇰' },
  { word: 'Finland', emoji: '🇫🇮' }, { word: 'New Zealand', emoji: '🇳🇿' }, { word: 'Singapore', emoji: '🇸🇬' }, { word: 'Malaysia', emoji: '🇲🇾' }
];
const FLAGS_DIFFICULT = [
  { word: 'Peru', emoji: '🇵🇪' }, { word: 'Chile', emoji: '🇨🇱' }, { word: 'Colombia', emoji: '🇨🇴' }, { word: 'Venezuela', emoji: '🇻🇪' },
  { word: 'Ecuador', emoji: '🇪🇨' }, { word: 'Bolivia', emoji: '🇧🇴' }, { word: 'Paraguay', emoji: '🇵🇾' }, { word: 'Uruguay', emoji: '🇺🇾' },
  { word: 'Cuba', emoji: '🇨🇺' }, { word: 'Jamaica', emoji: '🇯🇲' }, { word: 'Iceland', emoji: '🇮🇸' }, { word: 'Luxembourg', emoji: '🇱🇺' },
  { word: 'Monaco', emoji: '🇲🇨' }, { word: 'Malta', emoji: '🇲🇹' }, { word: 'Cyprus', emoji: '🇨🇾' }, { word: 'Croatia', emoji: '🇭🇷' },
  { word: 'Serbia', emoji: '🇷🇸' }, { word: 'Slovakia', emoji: '🇸🇰' }, { word: 'Slovenia', emoji: '🇸🇮' }, { word: 'Hungary', emoji: '🇭🇺' },
  { word: 'Romania', emoji: '🇷🇴' }, { word: 'Bulgaria', emoji: '🇧🇬' }, { word: 'Ukraine', emoji: '🇺🇦' }, { word: 'Estonia', emoji: '🇪🇪' },
  { word: 'Latvia', emoji: '🇱🇻' }, { word: 'Lithuania', emoji: '🇱🇹' }, { word: 'Morocco', emoji: '🇲🇦' }, { word: 'Algeria', emoji: '🇩🇿' },
  { word: 'Tunisia', emoji: '🇹🇳' }, { word: 'Kenya', emoji: '🇰🇪' }, { word: 'Nigeria', emoji: '🇳🇬' }, { word: 'Ghana', emoji: '🇬🇭' },
  { word: 'Ethiopia', emoji: '🇪🇹' }, { word: 'Tanzania', emoji: '🇹🇿' }, { word: 'Zimbabwe', emoji: '🇿🇼' }, { word: 'Sri Lanka', emoji: '🇱🇰' },
  { word: 'Bangladesh', emoji: '🇧🇩' }, { word: 'Pakistan', emoji: '🇵🇰' }, { word: 'Nepal', emoji: '🇳🇵' }, { word: 'Mongolia', emoji: '🇲🇳' }
];
const RANDOM_POOL = [
  { word: 'Umbrella', emoji: '☂️' }, { word: 'Guitar', emoji: '🎸' }, { word: 'Rocket', emoji: '🚀' }, { word: 'Anchor', emoji: '⚓' },
  { word: 'Compass', emoji: '🧭' }, { word: 'Trophy', emoji: '🏆' }, { word: 'Magnet', emoji: '🧲' }, { word: 'Envelope', emoji: '✉️' },
  { word: 'Kite', emoji: '🪁' }, { word: 'Satellite', emoji: '🛰️' }, { word: 'Volcano', emoji: '🌋' }, { word: 'Telescope', emoji: '🔭' },
  { word: 'Lantern', emoji: '🏮' }, { word: 'Chameleon', emoji: '🦎' }, { word: 'Scorpion', emoji: '🦂' }, { word: 'Raccoon', emoji: '🦝' },
  { word: 'Sloth', emoji: '🦥' }, { word: 'Otter', emoji: '🦦' }, { word: 'Walrus', emoji: '🦭' }, { word: 'Nesting Doll', emoji: '🪆' }
];

const STAGES = [
  { label: 'Animals (Easy)', pool: ANIMALS_EASY },
  { label: 'Animals (Normal)', pool: ANIMALS_NORMAL },
  { label: 'Flags (Normal)', pool: FLAGS_NORMAL },
  { label: 'Flags (Difficult)', pool: FLAGS_DIFFICULT },
  { label: 'Random (Crazy Mode)', pool: RANDOM_POOL, randomPick: 10 }
];
const TOTAL_STAGES = STAGES.length;

let currentDifficulty = 'manager';
let stageIndex = 0;
let lives = 3;
let score = 0;
let streak = 0;
let bestStreakRun = 0;
let bestStreakEver = parseInt(localStorage.getItem(BEST_STREAK_KEY) || '0', 10);
let cards = [];
let firstPick = null;
let secondPick = null;
let locked = false;
let wrongThisStage = 0;
let gameEnded = false;
let pendingRecord = null;
let hintsUsed = { reveal: false, flash: false };

let turnTimerInterval = null;
let turnTimeRemaining = 0;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function round1(n) { return Math.round(n * 10) / 10; }

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentDifficulty = data.currentDifficulty;
      stageIndex = data.stageIndex;
      lives = data.lives;
      score = data.score;
      streak = data.streak;
      bestStreakRun = data.bestStreakRun;
      wrongThisStage = data.wrongThisStage;
      cards = data.cards;
      hintsUsed = data.hintsUsed || { reveal: false, flash: false };
      document.getElementById('difficulty-overlay').style.display = 'none';
      document.getElementById('stageBanner').textContent = `Stage ${stageIndex + 1} — ${STAGES[stageIndex].label}`;
      updatePreviewNote();
      renderGrid();
      updateUI();
      toast('Welcome back! Resuming your run.');
      return;
    } catch (e) {
      localStorage.removeItem(SAVE_KEY);
    }
  }
}

function startGame(diffKey) {
  currentDifficulty = diffKey;
  lives = DIFFICULTIES[diffKey].lives;
  stageIndex = 0;
  score = 0;
  streak = 0;
  bestStreakRun = 0;
  gameEnded = false;
  hintsUsed = { reveal: false, flash: false };
  document.getElementById('difficulty-overlay').style.display = 'none';
  loadStage(0);
}

function buildStagePairs(stage) {
  if (stage.randomPick) return shuffle(stage.pool).slice(0, stage.randomPick);
  return shuffle(stage.pool).slice(0, 10);
}

function updatePreviewNote() {
  const note = document.getElementById('previewNote');
  note.style.display = 'none'; // only shown live during the active preview window itself
}

function loadStage(index) {
  stageIndex = index;
  wrongThisStage = 0;
  firstPick = null;
  secondPick = null;
  clearTurnTimer();

  const pairs = buildStagePairs(STAGES[index]);
  const raw = [];
  pairs.forEach((p, i) => {
    raw.push({ pairId: i, type: 'emoji', display: p.emoji, state: 'up', bonus: false });
    raw.push({ pairId: i, type: 'word', display: p.word, state: 'up', bonus: false });
  });
  cards = shuffle(raw);

  // 1–3 cards this stage are secretly "bonus" — matching one restores a life.
  const bonusCount = randInt(1, 3);
  const bonusIndices = shuffle(cards.map((_, i) => i)).slice(0, bonusCount);
  bonusIndices.forEach(i => { cards[i].bonus = true; });

  document.getElementById('stageBanner').textContent = `Stage ${stageIndex + 1} — ${STAGES[stageIndex].label}`;
  renderGrid();
  updateUI();
  updateHintButtons();

  const previewMs = PREVIEW_DURATIONS[stageIndex];
  if (previewMs > 0) {
    document.getElementById('previewNote').style.display = 'block';
    document.getElementById('previewNote').textContent = `Memorize the board... (${(previewMs / 1000).toFixed(0)}s)`;
    locked = true;
    setTimeout(() => {
      cards.forEach(c => { c.state = 'down'; });
      renderGrid();
      document.getElementById('previewNote').style.display = 'none';
      locked = false;
      saveGame(false);
    }, previewMs);
  } else {
    cards.forEach(c => { c.state = 'down'; });
    renderGrid();
    updatePreviewNote();
    locked = false;
    saveGame(false);
  }
}

function renderGrid() {
  const grid = document.getElementById('cardGrid');
  grid.innerHTML = '';
  cards.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'card ' + (c.state === 'matched' ? 'matched' : c.state === 'up' ? 'face-up' : 'face-down');
    if (c.type === 'word' && c.state !== 'down') el.classList.add('word-type');
    if (c.state !== 'down') el.textContent = c.display;
    if (c.bonus && c.state !== 'down') el.classList.add('bonus-reveal');
    el.dataset.index = i;
    el.onclick = () => flipCard(i);
    grid.appendChild(el);
  });
}

/* ===== Turn timer (time-limited mode) ===== */
function startTurnTimer() {
  clearTurnTimer();
  const limitSec = TIME_LIMITS[stageIndex];
  turnTimeRemaining = limitSec * 1000;
  const bar = document.getElementById('turnTimerFill');
  const wrap = document.getElementById('turnTimerWrap');
  wrap.style.display = 'block';
  bar.style.width = '100%';
  bar.classList.remove('warn');

  turnTimerInterval = setInterval(() => {
    turnTimeRemaining -= 100;
    const pct = Math.max(0, (turnTimeRemaining / (limitSec * 1000)) * 100);
    bar.style.width = pct + '%';
    if (turnTimeRemaining <= limitSec * 300) bar.classList.add('warn');
    if (turnTimeRemaining <= 0) {
      clearTurnTimer();
      handleTimeout();
    }
  }, 100);
}
function clearTurnTimer() {
  if (turnTimerInterval) clearInterval(turnTimerInterval);
  turnTimerInterval = null;
  document.getElementById('turnTimerWrap').style.display = 'none';
}
function handleTimeout() {
  if (firstPick === null || gameEnded) return;
  const a = cards[firstPick];
  a.state = 'down';
  firstPick = null;
  streak = 0;
  lives--;
  toast("Time's up! Missed.");
  renderGrid();
  updateUI();
  saveGame(false);
  if (lives <= 0) endGame(false);
}

/* ===== Guessing ===== */
function flipCard(i) {
  if (locked || gameEnded) return;
  const c = cards[i];
  if (c.state !== 'down') return;

  c.state = 'up';
  renderGrid();

  if (firstPick === null) {
    firstPick = i;
    startTurnTimer();
    updateHintButtons();
    return;
  }
  clearTurnTimer();
  secondPick = i;
  locked = true;
  updateHintButtons();

  const a = cards[firstPick];
  const b = cards[secondPick];
  const isMatch = a.pairId === b.pairId && a.type !== b.type;

  if (isMatch) {
    a.state = 'matched';
    b.state = 'matched';
    streak++;
    if (streak > bestStreakRun) bestStreakRun = streak;
    const mult = streak >= 2 ? Math.min(MAX_MULT, 1 + 0.1 * (streak - 1)) : 1.0;
    const gained = round1(BASE_POINTS * mult);
    score = round1(score + gained);
    toast(`Match! +${gained.toFixed(1)}${mult > 1 ? ` (×${mult.toFixed(1)} streak)` : ''}`);

    if (a.bonus || b.bonus) {
      const maxLives = DIFFICULTIES[currentDifficulty].lives;
      if (lives < maxLives) {
        lives++;
        pulseLives();
        showBonusBanner('🎉 Bonus card! +1 Life');
      } else {
        showBonusBanner('⭐ Bonus card! (Already at max lives)');
      }
    }

    renderGrid();
    updateUI();
    firstPick = null;
    secondPick = null;
    locked = false;
    updateHintButtons();
    saveGame(false);

    if (cards.every(c => c.state === 'matched')) {
      finishStage();
    }
  } else {
    wrongThisStage++;
    streak = 0;
    lives--;
    toast('No match.');
    renderGrid();
    updateUI();
    saveGame(false);

    setTimeout(() => {
      a.state = 'down';
      b.state = 'down';
      firstPick = null;
      secondPick = null;
      locked = false;
      renderGrid();
      updateHintButtons();
      saveGame(false);
      if (lives <= 0) endGame(false);
    }, MISMATCH_MS);
  }
}

function finishStage() {
  if (wrongThisStage === 0) {
    score = round1(score + PERFECT_BONUS);
    toast(`Perfect stage! +${PERFECT_BONUS} bonus`);
    updateUI();
  }
  setTimeout(() => {
    if (stageIndex < TOTAL_STAGES - 1) {
      loadStage(stageIndex + 1);
    } else {
      endGame(true);
    }
  }, 1000);
}

/* ===== Hints ===== */
function updateHintButtons() {
  const midTurn = firstPick !== null || locked;
  document.getElementById('hintRevealBtn').disabled = hintsUsed.reveal || midTurn || gameEnded;
  document.getElementById('hintFlashBtn').disabled = hintsUsed.flash || midTurn || gameEnded;
}

function useHintReveal() {
  if (hintsUsed.reveal || firstPick !== null || locked || gameEnded) return;
  hintsUsed.reveal = true;
  locked = true;
  const downCards = cards.filter(c => c.state === 'down');
  downCards.forEach(c => { c.state = 'up'; });
  renderGrid();
  toast(`Hint: board revealed for ${(HINT_REVEAL_MS / 1000).toFixed(0)}s.`);
  saveGame(false);

  setTimeout(() => {
    downCards.forEach(c => { c.state = 'down'; });
    renderGrid();
    locked = false;
    updateHintButtons();
    saveGame(false);
  }, HINT_REVEAL_MS);
}

function useHintFlash() {
  if (hintsUsed.flash || firstPick !== null || locked || gameEnded) return;
  const downPairIds = [...new Set(cards.filter(c => c.state === 'down').map(c => c.pairId))];
  if (downPairIds.length === 0) return;
  hintsUsed.flash = true;
  const targetPairId = downPairIds[Math.floor(Math.random() * downPairIds.length)];

  renderGrid();
  cards.forEach((c, i) => {
    if (c.pairId === targetPairId && c.state === 'down') {
      const el = document.querySelector(`.card[data-index="${i}"]`);
      if (el) el.classList.add('hint-flash');
    }
  });
  toast('Hint: one pair is highlighted.');
  updateHintButtons();
  saveGame(false);

  setTimeout(() => { renderGrid(); }, 2500);
}

function updateUI() {
  document.getElementById('stage').textContent = `${stageIndex + 1} / ${TOTAL_STAGES}`;
  document.getElementById('lives').textContent = Math.max(0, lives);
  document.getElementById('score').textContent = score.toFixed(1);
  document.getElementById('streak').textContent = streak;
  document.getElementById('time-limit').textContent = `${TIME_LIMITS[stageIndex]}s`;

  if (bestStreakRun > bestStreakEver) {
    bestStreakEver = bestStreakRun;
    localStorage.setItem(BEST_STREAK_KEY, bestStreakEver);
  }
  document.getElementById('best-streak').textContent = bestStreakEver;
}

/* ===== Save / Load / Reset ===== */
function saveGame(manual) {
  const data = { currentDifficulty, stageIndex, lives, score, streak, bestStreakRun, wrongThisStage, cards, hintsUsed };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (manual) toast('Progress saved.');
}
function resetGame() {
  if (confirm('Reset your current run? Saved progress will be cleared. Your Top 10 records are kept.')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

/* ===== Screenshot ===== */
function captureGame(silent) {
  html2canvas(document.getElementById('capture-area')).then(c => {
    const link = document.createElement('a');
    link.download = `CardMemory_${Date.now()}.png`;
    link.href = c.toDataURL();
    link.click();
    if (!silent) toast('Screenshot saved to your device.');
  });
}

/* ===== Leaderboard ===== */
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveLeaderboard(list) { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list)); }
function qualifiesForTop10(finalScore) {
  const list = loadLeaderboard();
  if (list.length < 10) return true;
  return finalScore > list[list.length - 1].score;
}
function escapeHtml(str) { const d = document.createElement('div'); d.innerText = str; return d.innerHTML; }
function renderLeaderboard() {
  const list = loadLeaderboard();
  const body = document.getElementById('leaderboard-body');
  body.innerHTML = '';
  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:20px;">No records yet — be the first.</td></tr>';
    return;
  }
  list.forEach((r, i) => {
    const tr = document.createElement('tr');
    const diffLabel = DIFFICULTIES[r.diff] ? DIFFICULTIES[r.diff].label.split(' (')[0] : r.diff;
    tr.innerHTML = `<td class="rank-cell">${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.stage}/${TOTAL_STAGES}</td><td>${diffLabel}</td><td>${r.bestStreak}</td><td>${r.score.toFixed(1)}</td><td>${r.date}</td>`;
    body.appendChild(tr);
  });
}
function openLeaderboard() { renderLeaderboard(); document.getElementById('leaderboard-overlay').style.display = 'flex'; }
function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ===== End of run ===== */
function endGame(won) {
  gameEnded = true;
  clearTurnTimer();
  localStorage.removeItem(SAVE_KEY);
  updateHintButtons();

  const finalScore = score;
  const stageReached = won ? TOTAL_STAGES : stageIndex + 1;
  pendingRecord = { finalScore, stageReached, bestStreakRun, diffKey: currentDifficulty, won };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'card-memory', won, stage: stageReached, score: finalScore });
  }

  if (qualifiesForTop10(finalScore)) {
    document.getElementById('name-title').innerText = won ? 'All Stages Cleared! New Top 10 Record!' : 'New Top 10 Record!';
    document.getElementById('name-sub').innerText = `Stage ${stageReached} · Score ${finalScore.toFixed(1)}`;
    document.getElementById('name-overlay').style.display = 'flex';
    document.getElementById('name-input').value = '';
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  } else {
    showEndSummary(won, finalScore, stageReached, bestStreakRun, null);
  }
}

function submitRecordName() {
  const input = document.getElementById('name-input');
  let name = input.value.trim();
  if (!name) name = 'Anonymous';
  name = name.slice(0, 14);

  const list = loadLeaderboard();
  const record = {
    name, score: pendingRecord.finalScore, stage: pendingRecord.stageReached,
    bestStreak: pendingRecord.bestStreakRun, diff: pendingRecord.diffKey,
    date: new Date().toISOString().slice(0, 10)
  };
  list.push(record);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  saveLeaderboard(trimmed);

  document.getElementById('name-overlay').style.display = 'none';
  const rank = trimmed.indexOf(record);
  const isTop1 = rank === 0;

  showEndSummary(pendingRecord.won, pendingRecord.finalScore, pendingRecord.stageReached, pendingRecord.bestStreakRun, rank >= 0 ? rank + 1 : null);

  if (isTop1) {
    toast('New all-time #1! Capturing a screenshot for you...');
    setTimeout(() => captureGame(true), 500);
  }
}

function showEndSummary(won, finalScore, stage, bestStreak, rank) {
  document.getElementById('end-title').innerText = won ? 'All 5 Stages Cleared!' : 'Run Complete';
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  document.getElementById('end-summary').innerText =
    `${won ? 'You matched every pair through Crazy Mode.' : `You ran out of lives at Stage ${stage}.`} Best streak: ${bestStreak}. Score: ${finalScore.toFixed(1)}.${rankLine}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

function openGuide() { document.getElementById('guide-overlay').style.display = 'flex'; }

function toast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function showBonusBanner(text) {
  const el = document.getElementById('bonusBanner');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showBonusBanner._timer);
  showBonusBanner._timer = setTimeout(() => el.classList.remove('show'), 1800);
}

function pulseLives() {
  const el = document.getElementById('lives');
  el.classList.remove('life-pulse');
  void el.offsetWidth;
  el.classList.add('life-pulse');
}

boot();
