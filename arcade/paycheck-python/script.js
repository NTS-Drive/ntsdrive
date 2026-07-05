/* ===== Constants ===== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 36; // doubled horizontally per feedback
const ROWS = 14;
let CELL_SIZE = 22;

const SAVE_KEY = 'pp_save';
const LEADERBOARD_KEY = 'pp_leaderboard';
const BEST_SCORE_KEY = 'pp_best_score';

const BASE_TICK_MS = [150, 130, 112]; // per-level baseline, before score-based speed-up
const SPEED_UP_PER_POINTS = 50; // every N points, speed increases another notch
const SPEED_UP_STEP_PCT = 0.10; // +10% speed per notch, relative to the level's base speed
const MIN_TICK_MS = 60;
const BASE_POINTS = 10;
const MASTER_TARGET = 100;

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',        lives: 5 },
  manager:  { label: 'Manager (Normal)',     lives: 3 },
  director: { label: 'Director (Difficult)', lives: 2 }
};

const MONEY_EMOJI = ['💰', '💵', '🪙', '💴', '💶'];
const LIFE_BONUS_EMOJI = '💎';
const SCORE_BONUS_EMOJI = '📈';
// Obstacles are plain colored blocks now (not emoji) so they never get
// confused with the money you're supposed to eat.
const OFFICE_COLOR = '#2c3e6b';   // matches the toolbar/chrome color
const BUILDING_COLOR = '#1f2d4d'; // darker shade for the bigger Level 3 obstacles

const LEVEL_CONFIG = [
  { target: 5, obstacleCount: 0, buildingCount: 0, bonusLifeCount: 1, bonusScoreCount: 0, label: 'Level 1' },
  { target: 10, obstacleCount: 4, buildingCount: 0, bonusLifeCount: 1, bonusScoreCount: 1, label: 'Level 2' },
  { target: MASTER_TARGET, obstacleCount: 4, buildingCount: 4, bonusLifeCount: 0, bonusScoreCount: 0, label: 'Level 3', combo: true }
];

/* ===== State ===== */
let currentDifficulty = 'manager';
let levelIndex = 0;
let lives = 3;
let score = 0;
let eatenCount = 0;
let comboCount = 0;
let bestScoreEver = parseFloat(localStorage.getItem(BEST_SCORE_KEY) || '0');

let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let coin = null;
let bonusCoins = [];
let obstacles = [];
let gameEnded = false;
let tickInterval = null;
let pendingRecord = null;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function round1(n) { return Math.round(n * 10) / 10; }
function speedTier() {
  return Math.floor(score / SPEED_UP_PER_POINTS);
}
function speedMultiplier() {
  // Each tier makes the effective rate 10% faster than the level's base rate.
  return 1 + speedTier() * SPEED_UP_STEP_PCT;
}
function currentTickMs() {
  const base = BASE_TICK_MS[levelIndex];
  return Math.max(MIN_TICK_MS, Math.round(base / speedMultiplier()));
}
function restartTickLoop() {
  clearInterval(tickInterval);
  tickInterval = setInterval(tick, currentTickMs());
}

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentDifficulty = data.currentDifficulty;
      levelIndex = data.levelIndex;
      lives = data.lives;
      score = data.score;
      eatenCount = data.eatenCount;
      comboCount = data.comboCount;
      snake = data.snake;
      dir = data.dir;
      nextDir = data.dir;
      coin = data.coin;
      bonusCoins = data.bonusCoins;
      obstacles = data.obstacles;
      document.getElementById('difficulty-overlay').style.display = 'none';
      init(true);
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
  levelIndex = 0;
  score = 0;
  eatenCount = 0;
  comboCount = 0;
  gameEnded = false;
  document.getElementById('difficulty-overlay').style.display = 'none';
  setupLevel({ resetSnake: true, regenerateItems: true, snakeLength: 3 });
  resize();
  draw();
  updateUI();
  clearInterval(tickInterval);
  startCountdown(5, () => { restartTickLoop(); });
}

function init(resuming) {
  resize();
  gameEnded = false;
  clearInterval(tickInterval);
  draw();
  if (resuming) {
    restartTickLoop(); // resumed sessions continue immediately, no countdown
  }
}

/* ===== Countdown (used before a fresh start and after every respawn) ===== */
function startCountdown(seconds, onComplete) {
  const overlay = document.getElementById('countdownOverlay');
  const numEl = document.getElementById('countdownNumber');
  let remaining = seconds;
  overlay.style.display = 'flex';
  numEl.textContent = remaining;

  const iv = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(iv);
      overlay.style.display = 'none';
      onComplete();
    } else {
      numEl.textContent = remaining;
    }
  }, 1000);
}

function resize() {
  const pane = document.querySelector('.reading-pane');
  const availWidth = Math.max(200, pane.clientWidth - 20);
  CELL_SIZE = Math.max(8, Math.min(24, Math.floor(availWidth / COLS)));
  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;
}
window.addEventListener('resize', () => { resize(); draw(); });

/* ===== Level setup ===== */
function emptyCells(exclude) {
  const taken = new Set(exclude.map(p => `${p.x},${p.y}`));
  const cells = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!taken.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  return cells;
}

function setupLevel(opts) {
  const { resetSnake, regenerateItems, snakeLength } = opts;
  const cfg = LEVEL_CONFIG[levelIndex];
  document.getElementById('level').textContent = `${levelIndex + 1} / 3`;

  if (regenerateItems) {
    obstacles = [];
    const occupiedForObstacles = () => [...snake, ...obstacles];
    for (let i = 0; i < cfg.obstacleCount; i++) {
      const free = emptyCells(occupiedForObstacles());
      if (free.length === 0) break;
      const cell = free[randInt(0, free.length - 1)];
      obstacles.push({ x: cell.x, y: cell.y, kind: 'office' });
    }
    for (let i = 0; i < cfg.buildingCount; i++) {
      const free = emptyCells(occupiedForObstacles());
      if (free.length === 0) break;
      const cell = free[randInt(0, free.length - 1)];
      obstacles.push({ x: cell.x, y: cell.y, kind: 'building' });
    }
  }

  if (resetSnake) {
    placeSnakeSafely(snakeLength || 3);
  }

  if (regenerateItems) {
    // Bonus coins are spawned exactly once per level (here) and never
    // re-granted on a mid-level respawn, to prevent farming lives by
    // repeatedly dying and respawning within the same level.
    coin = spawnCoinAt([...snake, ...obstacles]);
    bonusCoins = [];
    for (let i = 0; i < cfg.bonusLifeCount; i++) {
      const free = emptyCells([...snake, ...obstacles, ...bonusCoins, coin]);
      if (free.length === 0) break;
      const cell = free[randInt(0, free.length - 1)];
      bonusCoins.push({ x: cell.x, y: cell.y, kind: 'life' });
    }
    for (let i = 0; i < cfg.bonusScoreCount; i++) {
      const free = emptyCells([...snake, ...obstacles, ...bonusCoins, coin]);
      if (free.length === 0) break;
      const cell = free[randInt(0, free.length - 1)];
      bonusCoins.push({ x: cell.x, y: cell.y, kind: 'score' });
    }
  }
}

function placeSnakeSafely(length) {
  const forbidden = new Set([...obstacles, ...bonusCoins, ...(coin ? [coin] : [])].map(p => `${p.x},${p.y}`));
  const n = Math.max(1, length);

  // A cell is "unsafe to face" if it's an obstacle, or off the grid.
  // (A queued direction change during the countdown can dodge a wall, but
  // we don't rely on player reaction time for an obstacle right ahead.)
  function aheadBlocked(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    for (const o of obstacles) if (o.x === x && o.y === y) return true;
    return false;
  }

  if (n <= COLS) {
    // Short enough for one row — search outward from the horizontal center
    // so there's roughly equal room on both sides, and reject any spot
    // whose facing direction (2 cells ahead) runs straight into an obstacle.
    const idealStart = Math.floor((COLS - n) / 2);
    for (let attemptRow = 0; attemptRow < ROWS; attemptRow++) {
      const y = (Math.floor(ROWS / 2) + attemptRow) % ROWS;
      for (let radius = 0; radius <= COLS; radius++) {
        const candidates = radius === 0 ? [idealStart] : [idealStart + radius, idealStart - radius];
        for (const startX of candidates) {
          if (startX < 0 || startX > COLS - n) continue;
          let clear = true;
          for (let off = 0; off < n; off++) {
            if (forbidden.has(`${startX + off},${y}`)) { clear = false; break; }
          }
          if (!clear) continue;

          const headX = startX + n - 1;
          if (aheadBlocked(headX + 1, y) || aheadBlocked(headX + 2, y)) continue; // facing an obstacle — skip this spot

          const segs = [];
          for (let off = n - 1; off >= 0; off--) segs.push({ x: startX + off, y });
          snake = segs;
          dir = { x: 1, y: 0 };
          nextDir = { x: 1, y: 0 };
          return;
        }
      }
    }
  }

  // Longer than one row fits (deep into Level 3) — lay the body out in a
  // back-and-forth path so it still fits entirely on the grid.
  for (let rowOffset = 0; rowOffset < ROWS; rowOffset++) {
    const path = [];
    let ok = true;
    outer:
    for (let r = 0; r < ROWS; r++) {
      const y = (rowOffset + r) % ROWS;
      const leftToRight = r % 2 === 0;
      for (let c = 0; c < COLS; c++) {
        const x = leftToRight ? c : COLS - 1 - c;
        if (forbidden.has(`${x},${y}`)) { ok = false; break outer; }
        path.push({ x, y });
        if (path.length === n) break outer;
      }
    }
    if (ok && path.length === n) {
      const head = path[path.length - 1];
      const neck = path[path.length - 2];
      const dirX = head.x - neck.x, dirY = head.y - neck.y;
      if (aheadBlocked(head.x + dirX, head.y + dirY)) { continue; } // facing an obstacle — try the next row offset
      snake = path.reverse(); // head = the far end of the path
      dir = { x: dirX, y: dirY };
      nextDir = dir;
      return;
    }
  }

  // Last-resort fallback (extremely unlikely): clip to what fits, ignoring overlap.
  const centerX = Math.floor(COLS / 2);
  const centerY = Math.floor(ROWS / 2);
  const segs = [];
  for (let off = 0; off < n; off++) segs.push({ x: Math.max(0, centerX - off), y: centerY });
  snake = segs;
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
}

function spawnCoinAt(exclude) {
  const free = emptyCells(exclude);
  if (free.length === 0) return null;
  const cell = free[randInt(0, free.length - 1)];
  return { x: cell.x, y: cell.y, emoji: MONEY_EMOJI[randInt(0, MONEY_EMOJI.length - 1)] };
}

/* ===== Input ===== */
function setDir(name) {
  const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const d = map[name];
  if (!d) return;
  // Disallow reversing directly into the snake's own neck.
  if (snake.length > 1 && d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
}
window.addEventListener('keydown', e => {
  if (gameEnded) return;
  const keyMap = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right'
  };
  if (keyMap[e.key]) { e.preventDefault(); setDir(keyMap[e.key]); }
});

/* ===== Main tick ===== */
function tick() {
  if (gameEnded) return;
  dir = nextDir;

  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  const hitWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
  const hitSelf = !hitWall && snake.some((seg, i) => i < snake.length - 1 && seg.x === newHead.x && seg.y === newHead.y);
  const hitObstacle = !hitWall && obstacles.find(o => o.x === newHead.x && o.y === newHead.y);

  if (hitWall || hitSelf || hitObstacle) {
    handleCollision(hitObstacle ? 'obstacle' : (hitWall ? 'wall' : 'self'));
    return;
  }

  let grew = false;

  if (coin && newHead.x === coin.x && newHead.y === coin.y) {
    eatenCount++;
    if (LEVEL_CONFIG[levelIndex].combo) {
      comboCount++;
      score = round1(score + BASE_POINTS * (1 + comboCount / 100));
    } else {
      score = round1(score + BASE_POINTS);
    }
    grew = true;
    coin = spawnCoinAt([...snake, ...obstacles, ...bonusCoins, newHead]);
    saveGame(false);
  }

  const bonusHitIdx = bonusCoins.findIndex(b => b.x === newHead.x && b.y === newHead.y);
  if (bonusHitIdx !== -1) {
    const bonus = bonusCoins[bonusHitIdx];
    bonusCoins.splice(bonusHitIdx, 1);
    grew = true;
    if (bonus.kind === 'life') {
      score = round1(score + BASE_POINTS);
      const maxLives = DIFFICULTIES[currentDifficulty].lives;
      if (lives < maxLives) {
        lives++;
        pulseLives();
        showBonusBanner('🎉 Bonus! +1 Life');
      } else {
        showBonusBanner('💎 Bonus! (Already at max lives)');
      }
    } else if (bonus.kind === 'score') {
      const gained = round1(BASE_POINTS * 1.5);
      score = round1(score + gained);
      showBonusBanner(`📈 Bonus! +${gained.toFixed(1)} points (×1.5)`);
    }
    saveGame(false);
  }

  snake.unshift(newHead);
  if (!grew) snake.pop();

  if (grew) restartTickLoop(); // speed ramps up gradually as score climbs

  updateUI();
  draw();

  if (eatenCount >= LEVEL_CONFIG[levelIndex].target) {
    advanceLevel();
  }
}

function handleCollision(type) {
  lives--;
  updateUI();

  if (type === 'wall' || type === 'self') {
    comboCount = 0;
  }
  // Obstacle hits deliberately do not reset the Level 3 combo.

  flashDamage();
  toast(type === 'obstacle' ? 'Hit an obstacle! -1 life' : 'Crashed! -1 life');

  if (lives <= 0) {
    endGame(false);
    return;
  }

  clearInterval(tickInterval);
  const preCrashLength = snake.length; // respawn keeps the same length, doesn't shrink back to 3
  setupLevel({ resetSnake: true, regenerateItems: false, snakeLength: preCrashLength });
  saveGame(false);
  draw();
  startCountdown(3, () => { restartTickLoop(); });
}

function flashDamage() {
  const c = document.getElementById('container');
  c.style.boxShadow = '0 0 0 3px var(--bad)';
  setTimeout(() => { c.style.boxShadow = 'none'; }, 300);
}

function advanceLevel() {
  if (levelIndex >= LEVEL_CONFIG.length - 1) {
    endGame(true, true); // Payroll Master
    return;
  }
  levelIndex++;
  eatenCount = 0;
  comboCount = 0;
  setupLevel({ resetSnake: false, regenerateItems: true }); // keep current snake body/length, new obstacles/coins for the new level
  restartTickLoop();
  toast(`${LEVEL_CONFIG[levelIndex].label}! New challenges ahead.`);
  updateUI();
  saveGame(false);
}

/* ===== Drawing ===== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fafbfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#eee';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL_SIZE, 0); ctx.lineTo(x * CELL_SIZE, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL_SIZE); ctx.lineTo(canvas.width, y * CELL_SIZE); ctx.stroke();
  }

  // Obstacles — plain colored blocks (not emoji) so they're never confused with coins.
  obstacles.forEach(o => {
    const cx = o.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = o.y * CELL_SIZE + CELL_SIZE / 2;
    const size = o.kind === 'building' ? CELL_SIZE * 1.5 : CELL_SIZE * 0.9;
    ctx.fillStyle = o.kind === 'building' ? BUILDING_COLOR : OFFICE_COLOR;
    roundRect(cx - size / 2, cy - size / 2, size, size, 4);
    ctx.fill();
  });

  // Coin
  if (coin) {
    ctx.font = `${CELL_SIZE * 0.85}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(coin.emoji, coin.x * CELL_SIZE + CELL_SIZE / 2, coin.y * CELL_SIZE + CELL_SIZE / 2);
  }

  // Bonus coins
  bonusCoins.forEach(b => {
    const cx = b.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = b.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.strokeStyle = 'rgba(47,143,91,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, CELL_SIZE * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `${CELL_SIZE * 0.8}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.kind === 'life' ? LIFE_BONUS_EMOJI : SCORE_BONUS_EMOJI, cx, cy);
  });

  // Snake
  snake.forEach((seg, i) => {
    const x = seg.x * CELL_SIZE, y = seg.y * CELL_SIZE;
    ctx.fillStyle = i === 0 ? '#2c3e6b' : '#4d5f8f';
    roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 5);
    ctx.fill();
    if (i === 0) {
      ctx.fillStyle = '#fff';
      const eyeOffsetX = dir.x !== 0 ? dir.x * 3 : 0;
      const eyeOffsetY = dir.y !== 0 ? dir.y * 1 : 0;
      ctx.beginPath(); ctx.arc(x + CELL_SIZE / 2 - 4 + eyeOffsetX, y + CELL_SIZE / 2 - 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + CELL_SIZE / 2 + 4 + eyeOffsetX, y + CELL_SIZE / 2 - 3 + eyeOffsetY, 2, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ===== UI ===== */
function updateUI() {
  document.getElementById('level').textContent = `${levelIndex + 1} / 3`;
  document.getElementById('lives').textContent = Math.max(0, lives);
  document.getElementById('score').textContent = score.toFixed(1);
  document.getElementById('speed').textContent = `+${speedTier() * 10}%`;
  document.getElementById('eaten').textContent = `${eatenCount} / ${LEVEL_CONFIG[levelIndex].target}`;
  document.getElementById('folder-count').textContent = score.toFixed(1);

  if (score > bestScoreEver) {
    bestScoreEver = score;
    localStorage.setItem(BEST_SCORE_KEY, bestScoreEver);
  }
  document.getElementById('best-score').textContent = bestScoreEver.toFixed(1);
}

function pulseLives() {
  const el = document.getElementById('lives');
  el.classList.remove('life-pulse');
  void el.offsetWidth;
  el.classList.add('life-pulse');
}
function showBonusBanner(text) {
  const el = document.getElementById('bonusBanner');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showBonusBanner._timer);
  showBonusBanner._timer = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ===== Save / Load / Reset ===== */
function saveGame(manual) {
  const data = { currentDifficulty, levelIndex, lives, score, eatenCount, comboCount, snake, dir, coin, bonusCoins, obstacles };
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
    link.download = `PaycheckPython_${Date.now()}.png`;
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
    const diffLabel = DIFFICULTIES[r.diff] ? DIFFICULTIES[r.diff].label.split(' (')[0] : r.diff;
    tr.innerHTML = `<td class="rank-cell">${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.level}/3</td><td>${diffLabel}</td><td>${r.score.toFixed(1)}</td><td>${r.date}</td>`;
    body.appendChild(tr);
  });
}
function openLeaderboard() { renderLeaderboard(); document.getElementById('leaderboard-overlay').style.display = 'flex'; }
function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ===== End of run ===== */
function endGame(won, isMaster) {
  gameEnded = true;
  clearInterval(tickInterval);
  localStorage.removeItem(SAVE_KEY);

  const finalScore = score;
  const levelReached = levelIndex + 1;
  pendingRecord = { finalScore, levelReached, diffKey: currentDifficulty, won: !!won, isMaster: !!isMaster };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'paycheck-python', won: !!won, level: levelReached, score: finalScore, master: !!isMaster });
  }

  if (qualifiesForTop10(finalScore)) {
    document.getElementById('name-title').innerText = isMaster ? "You're a Payroll Master!" : 'New Top 10 Record!';
    document.getElementById('name-sub').innerText = `Level ${levelReached} · Score ${finalScore.toFixed(1)}`;
    document.getElementById('name-overlay').style.display = 'flex';
    document.getElementById('name-input').value = '';
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  } else {
    showEndSummary(finalScore, levelReached, null, isMaster);
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
    diff: pendingRecord.diffKey, date: new Date().toISOString().slice(0, 10)
  };
  list.push(record);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  saveLeaderboard(trimmed);

  document.getElementById('name-overlay').style.display = 'none';
  const rank = trimmed.indexOf(record);
  const isTop1 = rank === 0;

  showEndSummary(pendingRecord.finalScore, pendingRecord.levelReached, rank >= 0 ? rank + 1 : null, pendingRecord.isMaster);

  if (isTop1) {
    toast('New all-time #1! Capturing a screenshot for you...');
    setTimeout(() => captureGame(true), 500);
  }
}

function showEndSummary(finalScore, level, rank, isMaster) {
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  if (isMaster) {
    document.getElementById('end-title').innerText = '🎉 Payroll Master!';
    document.getElementById('end-summary').innerText = `You ate 100 coins in Level 3 without quitting. Score: ${finalScore.toFixed(1)}.${rankLine}`;
  } else {
    document.getElementById('end-title').innerText = 'Run Complete';
    document.getElementById('end-summary').innerText = `You ran out of lives at Level ${level}. Score: ${finalScore.toFixed(1)}.${rankLine}`;
  }
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

boot();
