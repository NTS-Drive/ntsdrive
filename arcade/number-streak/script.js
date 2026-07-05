const SAVE_KEY = 'ns_save_v2';
const LEADERBOARD_KEY = 'ns_leaderboard_v2';
const BEST_STREAK_KEY = 'ns_best_streak_v2';

const TOTAL_LEVELS = 10;
const ROUNDS_PER_LEVEL = 10;
const BASE_POINTS = 10;
const MAX_MULT = 2.0;
const REVEAL_MS = 3800; // how long the result + revealed number stay up before the round advances
const LEVEL_RANGES = [5, 10, 20, 50, 100, 150, 200, 300, 500, 1000];
function levelThreshold(level) { return 40 + level * 10; }
function currentMax() { return LEVEL_RANGES[currentLevel - 1]; }
function drawBonusMult(level) {
  if (level <= 3) return 3;
  if (level <= 7) return 5;
  return 10;
}

let currentLevel = 1;
let roundIndex = 1;
let score = 0;
let scoreAtLevelStart = 0;
let streak = 0;
let bestStreakRun = 0;
let bestStreakEver = parseInt(localStorage.getItem(BEST_STREAK_KEY) || '0', 10);
let currentNumber = 0;
let roundHistory = new Array(ROUNDS_PER_LEVEL).fill('');
let gameEnded = false;
let locked = false;
let pendingRecord = null;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function round1(n) { return Math.round(n * 10) / 10; }

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentLevel = data.currentLevel;
      roundIndex = data.roundIndex;
      score = data.score;
      scoreAtLevelStart = data.scoreAtLevelStart;
      streak = data.streak;
      bestStreakRun = data.bestStreakRun;
      currentNumber = data.currentNumber;
      roundHistory = data.roundHistory;
      render();
      updateUI();
      toast('Welcome back! Resuming your run.');
      return;
    } catch (e) {
      localStorage.removeItem(SAVE_KEY);
    }
  }
  startNewRun();
}

function startNewRun() {
  currentLevel = 1;
  roundIndex = 1;
  score = 0;
  scoreAtLevelStart = 0;
  streak = 0;
  bestStreakRun = 0;
  gameEnded = false;
  roundHistory = new Array(ROUNDS_PER_LEVEL).fill('');
  currentNumber = randInt(0, currentMax());
  render();
  updateUI();
}

function render() {
  document.getElementById('currentNumber').textContent = currentNumber;
  resetNextBox();
  renderRoundTable();
}

function resetNextBox() {
  const box = document.getElementById('nextBox');
  box.classList.add('pending');
  document.getElementById('nextValue').textContent = 'Will the next number be higher, lower, or draw?';
}

function renderRoundTable() {
  const header = document.getElementById('roundHeader');
  const results = document.getElementById('roundResults');
  header.innerHTML = '';
  results.innerHTML = '';
  for (let i = 0; i < ROUNDS_PER_LEVEL; i++) {
    const th = document.createElement('th');
    th.textContent = i + 1;
    header.appendChild(th);

    const td = document.createElement('td');
    const r = roundHistory[i];
    if (r === 'hit') { td.textContent = 'O'; td.className = 'hit'; }
    else if (r === 'miss') { td.textContent = 'X'; td.className = 'miss'; }
    else { td.textContent = '–'; td.className = 'pending'; }
    results.appendChild(td);
  }
}

/* ===== Guessing ===== */
function setButtonsDisabled(disabled) {
  document.getElementById('lowerBtn').disabled = disabled;
  document.getElementById('drawBtn').disabled = disabled;
  document.getElementById('higherBtn').disabled = disabled;
}

function guess(direction) {
  if (gameEnded || locked) return;
  locked = true;
  setButtonsDisabled(true);

  const max = currentMax();
  const next = randInt(0, max);
  const actual = next > currentNumber ? 'higher' : (next < currentNumber ? 'lower' : 'draw');
  const correct = direction === actual;

  const box = document.getElementById('nextBox');
  box.classList.remove('pending');
  document.getElementById('nextValue').textContent = next;

  if (correct) {
    streak++;
    if (streak > bestStreakRun) bestStreakRun = streak;
    const streakMult = streak >= 2 ? Math.min(MAX_MULT, 1 + 0.1 * (streak - 1)) : 1.0;
    const drawMult = actual === 'draw' ? drawBonusMult(currentLevel) : 1;
    const roundScore = round1(BASE_POINTS * streakMult * drawMult);
    score = round1(score + roundScore);
    roundHistory[roundIndex - 1] = 'hit';
    const tagParts = [];
    if (streakMult > 1) tagParts.push(`×${streakMult.toFixed(1)} streak`);
    if (drawMult > 1) tagParts.push(`×${drawMult} draw bonus`);
    toast(`Correct — it was ${actual}! +${roundScore.toFixed(1)}${tagParts.length ? ` (${tagParts.join(', ')})` : ''}`, REVEAL_MS);
  } else {
    streak = 0;
    roundHistory[roundIndex - 1] = 'miss';
    toast(`Miss — it was ${actual}.`, REVEAL_MS);
  }

  // Internal state updates immediately (so save/comparison stays correct),
  // but the visible "Current" number box only updates once the toast clears
  // — see the setTimeout below. This was the root cause of the "wrong
  // answer showing as correct" bug: the box used to stay frozen on the very
  // first round's number forever, so players were comparing against a
  // stale on-screen value even though the game itself compared correctly.
  currentNumber = next;
  renderRoundTable();
  updateUI();
  saveGame(false);

  setTimeout(() => {
    locked = false;
    document.getElementById('currentNumber').textContent = currentNumber;

    if (roundIndex >= ROUNDS_PER_LEVEL) {
      finishLevel();
    } else {
      roundIndex++;
      resetNextBox();
      updateUI();
      saveGame(false);
    }
  }, REVEAL_MS);
}

function finishLevel() {
  const earned = round1(score - scoreAtLevelStart);
  const threshold = levelThreshold(currentLevel);

  if (earned >= threshold) {
    if (currentLevel < TOTAL_LEVELS) {
      currentLevel++;
      roundIndex = 1;
      scoreAtLevelStart = score;
      roundHistory = new Array(ROUNDS_PER_LEVEL).fill('');
      resetNextBox();
      toast(`Level ${currentLevel}! Range is now 0–${currentMax()}.`);
      updateUI();
      renderRoundTable();
      saveGame(false);
    } else {
      endGame(true);
    }
  } else {
    endGame(false);
  }
}

function updateUI() {
  document.getElementById('level').textContent = `${currentLevel} / ${TOTAL_LEVELS}`;
  document.getElementById('round').textContent = `${roundIndex} / ${ROUNDS_PER_LEVEL}`;
  document.getElementById('score').textContent = score.toFixed(1);
  document.getElementById('streak').textContent = streak;

  if (bestStreakRun > bestStreakEver) {
    bestStreakEver = bestStreakRun;
    localStorage.setItem(BEST_STREAK_KEY, bestStreakEver);
  }
  document.getElementById('best-streak').textContent = bestStreakEver;

  const max = currentMax();
  const earned = round1(score - scoreAtLevelStart);
  const target = levelThreshold(currentLevel);

  document.getElementById('rangeBanner').textContent = `Level ${currentLevel} — numbers range from 0 to ${max}`;
  document.getElementById('targetBanner').innerHTML =
    `Level target: <b>${target.toFixed(1)} pts</b> — earned so far: <b class="${earned >= target ? 'earned' : ''}">${earned.toFixed(1)} pts</b>`;

  // Buttons are only ever disabled while a result is being revealed or the
  // run has ended — never based on the current number's position in the
  // range, which used to make Lower/Higher randomly (and confusingly)
  // unclickable near the edges of the range.
  setButtonsDisabled(gameEnded || locked);
}

/* ===== Save / Load / Reset ===== */
function saveGame(manual) {
  const data = { currentLevel, roundIndex, score, scoreAtLevelStart, streak, bestStreakRun, currentNumber, roundHistory };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (manual) toast('Progress saved.');
}
function resetGame() {
  if (confirm('Reset your current run? Saved progress will be cleared and you\'ll start over from Level 1. Your Top 10 records are kept.')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

/* ===== Screenshot ===== */
function captureGame(silent) {
  html2canvas(document.getElementById('capture-area')).then(c => {
    const link = document.createElement('a');
    link.download = `NumberStreak_${Date.now()}.png`;
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
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ink-muted);padding:20px;">No records yet — be the first.</td></tr>';
    return;
  }
  list.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="rank-cell">${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.level}/10</td><td>${r.bestStreak}</td><td>${r.score.toFixed(1)}</td><td>${r.date}</td>`;
    body.appendChild(tr);
  });
}
function openLeaderboard() { renderLeaderboard(); document.getElementById('leaderboard-overlay').style.display = 'flex'; }
function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ===== End of run ===== */
function endGame(won) {
  gameEnded = true;
  localStorage.removeItem(SAVE_KEY);
  updateUI();

  const finalScore = score;
  pendingRecord = { finalScore, levelReached: currentLevel, bestStreakRun, won };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'number-streak', won, level: currentLevel, score: finalScore });
  }

  if (qualifiesForTop10(finalScore)) {
    document.getElementById('name-title').innerText = won ? 'Perfect Run! New Top 10 Record!' : 'New Top 10 Record!';
    document.getElementById('name-sub').innerText = `Level ${currentLevel} · Score ${finalScore.toFixed(1)}`;
    document.getElementById('name-overlay').style.display = 'flex';
    document.getElementById('name-input').value = '';
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  } else {
    showEndSummary(won, finalScore, currentLevel, bestStreakRun, null);
  }
}

function submitRecordName() {
  const input = document.getElementById('name-input');
  let name = input.value.trim();
  if (!name) name = 'Anonymous';
  name = name.slice(0, 14);

  const list = loadLeaderboard();
  const record = {
    name, score: pendingRecord.finalScore, level: pendingRecord.levelReached,
    bestStreak: pendingRecord.bestStreakRun, date: new Date().toISOString().slice(0, 10)
  };
  list.push(record);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  saveLeaderboard(trimmed);

  document.getElementById('name-overlay').style.display = 'none';
  const rank = trimmed.indexOf(record);
  const isTop1 = rank === 0;

  showEndSummary(pendingRecord.won, pendingRecord.finalScore, pendingRecord.levelReached, pendingRecord.bestStreakRun, rank >= 0 ? rank + 1 : null);

  if (isTop1) {
    toast('New all-time #1! Capturing a screenshot for you...');
    setTimeout(() => captureGame(true), 500);
  }
}

function showEndSummary(won, finalScore, level, bestStreak, rank) {
  document.getElementById('end-title').innerText = won ? 'All 10 Levels Cleared!' : 'Run Complete';
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  document.getElementById('end-summary').innerText =
    `${won ? 'You cleared every level up to the 0–1000 range.' : `You fell short of the target at Level ${level}.`} Best streak: ${bestStreak}. Score: ${finalScore.toFixed(1)}.${rankLine}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

function openGuide() { document.getElementById('guide-overlay').style.display = 'flex'; }

function toast(msg, duration) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), duration || 2600);
}

boot();
