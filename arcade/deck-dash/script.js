/* ===== Constants ===== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const maxLevel = 10;
const SAVE_KEY = 'dd_save';
const LEADERBOARD_KEY = 'dd_leaderboard';
const HIGH_LEVEL_KEY = 'dd_highLevel';
const GRAVITY = 0.9;
const JUMP_VELOCITY = -15;
const GROUND_MARGIN = 70;
const PLAYER_X = 90;
const PLAYER_W = 32;
const PLAYER_H_STAND = 36;
const PLAYER_H_DUCK = 20;
const INVULN_MS = 1200;

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',        lives: 5, speedMult: 0.8, scoreBonus: 0 },
  manager:  { label: 'Manager (Normal)',     lives: 3, speedMult: 1.0, scoreBonus: 50 },
  director: { label: 'Director (Difficult)', lives: 2, speedMult: 1.3, scoreBonus: 150 }
};

/* ===== State ===== */
let lives = 3;
let currentLevel = 1;
let currentDifficulty = 'manager';
let distanceInLevel = 0;
let totalDistance = 0;
let obstacles = [];
let lastSpawn = 0;
let spawnGap = 1400;
let gameEnded = false;
let invulnUntil = 0;
let pendingRecord = null;
let highLevelEver = parseInt(localStorage.getItem(HIGH_LEVEL_KEY) || '0', 10);

const player = { y: 0, vy: 0, isJumping: false, isDucking: false };

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentDifficulty = data.currentDifficulty || 'manager';
      currentLevel = data.currentLevel || 1;
      lives = data.lives != null ? data.lives : DIFFICULTIES[currentDifficulty].lives;
      document.getElementById('difficulty-overlay').style.display = 'none';
      init();
      updateUI();
      toast(`Welcome back! Resuming as ${DIFFICULTIES[currentDifficulty].label} — Level ${currentLevel}`);
      return;
    } catch (e) {
      localStorage.removeItem(SAVE_KEY);
    }
  }
}

function startGame(diffKey) {
  currentDifficulty = diffKey;
  const diff = DIFFICULTIES[diffKey];
  lives = diff.lives;
  currentLevel = 1;
  distanceInLevel = 0;
  totalDistance = 0;
  obstacles = [];
  document.getElementById('difficulty-overlay').style.display = 'none';
  init();
  updateUI();
}

function init() {
  resize();
  player.y = groundTop() - PLAYER_H_STAND;
  gameEnded = false;
  obstacles = [];
  lastSpawn = performance.now();
  requestAnimationFrame(gameLoop);
}

function resize() {
  const chromeHeight = document.getElementById('chrome').offsetHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - chromeHeight;
}

function groundTop() {
  return canvas.height - GROUND_MARGIN;
}

/* ===== Input ===== */
function doJump() {
  if (gameEnded) return;
  if (!player.isJumping && !player.isDucking) {
    player.vy = JUMP_VELOCITY;
    player.isJumping = true;
  }
}
function setDuck(on) {
  if (gameEnded) return;
  if (!player.isJumping) player.isDucking = on;
}

window.addEventListener('keydown', e => {
  if (document.getElementById('guide-overlay').style.display === 'flex') return;
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
  if (e.code === 'ArrowDown') { e.preventDefault(); setDuck(true); }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown') setDuck(false);
});
document.getElementById('container').addEventListener('pointerdown', doJump);

/* ===== Obstacles ===== */
function currentSpeed() {
  const diff = DIFFICULTIES[currentDifficulty];
  return (4 + currentLevel * 0.4) * diff.speedMult;
}

function spawnObstacle() {
  const groundY = groundTop();
  const canChase = currentLevel > 5 && Math.random() < 0.22;

  if (canChase) {
    obstacles.push({
      type: 'chaser', x: canvas.width + 20, y: groundY - 24, w: 24, h: 24,
      speedMult: 1.5
    });
    return;
  }

  const isHigh = Math.random() < 0.35;
  if (isHigh) {
    obstacles.push({
      type: 'high', x: canvas.width + 20, y: groundY - 70, w: 34, h: 18,
      speedMult: 1
    });
  } else {
    const variants = [
      { w: 16, h: 26 }, // typo squiggle block
      { w: 26, h: 22 }, // comment bubble
      { w: 22, h: 30 }  // popup
    ];
    const v = variants[Math.floor(Math.random() * variants.length)];
    obstacles.push({ type: 'low', x: canvas.width + 20, y: groundY - v.h, w: v.w, h: v.h, speedMult: 1 });
  }
}

/* ===== Main loop ===== */
function gameLoop(ts) {
  if (gameEnded) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const groundY = groundTop();
  const speed = currentSpeed();

  // Background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#eee';
  for (let x = -((totalDistance) % 60); x < canvas.width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke();
  }
  ctx.strokeStyle = '#ccc';
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= groundY - PLAYER_H_STAND) {
    player.y = groundY - PLAYER_H_STAND;
    player.vy = 0;
    player.isJumping = false;
  }
  const pH = player.isDucking && !player.isJumping ? PLAYER_H_DUCK : PLAYER_H_STAND;
  const pY = player.isDucking && !player.isJumping ? groundY - PLAYER_H_DUCK : player.y;

  drawPlayer(pY, pH);

  // Spawn
  if (ts - lastSpawn > spawnGap) {
    spawnObstacle();
    lastSpawn = ts;
    spawnGap = Math.max(600, 1400 - currentLevel * 60 - Math.random() * 200);
  }

  // Move & draw obstacles, check collisions
  const invuln = performance.now() < invulnUntil;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed * o.speedMult;
    drawObstacle(o);

    if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }

    const hit = PLAYER_X < o.x + o.w && PLAYER_X + PLAYER_W > o.x &&
                pY < o.y + o.h && pY + pH > o.y;
    if (hit && !invuln) {
      const damage = o.type === 'chaser' ? 2 : 1;
      lives -= damage;
      invulnUntil = performance.now() + INVULN_MS;
      obstacles.splice(i, 1);
      updateUI();
      if (lives <= 0) {
        endGame(false);
        return;
      }
    }
  }

  // Distance & level progression
  distanceInLevel += speed;
  totalDistance += speed;
  const levelTarget = 900 + currentLevel * 100;
  document.getElementById('distance').textContent = `${Math.floor(totalDistance / 10)} m`;

  if (distanceInLevel >= levelTarget) {
    if (currentLevel < maxLevel) {
      currentLevel++;
      distanceInLevel = 0;
      document.getElementById('msg').textContent = `Level ${currentLevel} — deck scrolling faster.`;
      saveGame(false);
      updateUI();
    } else {
      endGame(true);
      return;
    }
  }

  requestAnimationFrame(gameLoop);
}

function drawPlayer(pY, pH) {
  const invuln = performance.now() < invulnUntil;
  if (invuln && Math.floor(performance.now() / 100) % 2 === 0) return; // blink when invulnerable

  ctx.fillStyle = '#2E7D6B';
  ctx.beginPath();
  const r = 6;
  ctx.moveTo(PLAYER_X + r, pY);
  ctx.arcTo(PLAYER_X + PLAYER_W, pY, PLAYER_X + PLAYER_W, pY + pH, r);
  ctx.arcTo(PLAYER_X + PLAYER_W, pY + pH, PLAYER_X, pY + pH, r);
  ctx.arcTo(PLAYER_X, pY + pH, PLAYER_X, pY, r);
  ctx.arcTo(PLAYER_X, pY, PLAYER_X + PLAYER_W, pY, r);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(PLAYER_X + PLAYER_W * 0.35, pY + pH * 0.35, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(PLAYER_X + PLAYER_W * 0.68, pY + pH * 0.35, 3, 0, Math.PI * 2); ctx.fill();

  // legs (simple run animation)
  if (!player.isJumping) {
    const phase = Math.floor(totalDistance / 8) % 2;
    ctx.fillStyle = '#235f54';
    if (phase === 0) {
      ctx.fillRect(PLAYER_X + 4, pY + pH, 6, 6);
      ctx.fillRect(PLAYER_X + PLAYER_W - 10, pY + pH, 6, 4);
    } else {
      ctx.fillRect(PLAYER_X + 4, pY + pH, 6, 4);
      ctx.fillRect(PLAYER_X + PLAYER_W - 10, pY + pH, 6, 6);
    }
  }
}

function drawObstacle(o) {
  if (o.type === 'chaser') {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(192,57,43,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 + 5, 0, Math.PI * 2); ctx.stroke();
  } else if (o.type === 'high') {
    ctx.fillStyle = '#b9770e';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 10px 'IBM Plex Mono', monospace";
    ctx.fillText('!', o.x + o.w / 2 - 2, o.y + o.h / 2 + 4);
  } else {
    ctx.fillStyle = '#2c4a86';
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }
}

/* ===== UI ===== */
function updateUI() {
  document.getElementById('lives').textContent = Math.max(0, lives);
  document.getElementById('level').textContent = `${currentLevel} / ${maxLevel}`;
  document.getElementById('diff-label').textContent = DIFFICULTIES[currentDifficulty].label.split(' (')[0];

  if (currentLevel > highLevelEver) {
    highLevelEver = currentLevel;
    localStorage.setItem(HIGH_LEVEL_KEY, highLevelEver);
  }
  document.getElementById('high-score').textContent = highLevelEver;
}

/* ===== Save / Load / Reset ===== */
function saveGame(manual) {
  const data = { lives, currentLevel, currentDifficulty };
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
    link.download = `DeckDash_Lv${currentLevel}_${Date.now()}.png`;
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
function computeScore(levelReached, distance, diffKey) {
  const bonus = DIFFICULTIES[diffKey] ? DIFFICULTIES[diffKey].scoreBonus : 0;
  return Math.floor(distance / 10) + levelReached * 200 + bonus;
}
function qualifiesForTop10(score) {
  const list = loadLeaderboard();
  if (list.length < 10) return true;
  return score > list[list.length - 1].score;
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
    tr.innerHTML = `<td class="rank-cell">${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${r.level}/10</td><td>${diffLabel}</td><td>${r.score}</td><td>${r.date}</td>`;
    body.appendChild(tr);
  });
}
function openLeaderboard() { renderLeaderboard(); document.getElementById('leaderboard-overlay').style.display = 'flex'; }
function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ===== End of run ===== */
function endGame(won) {
  gameEnded = true;
  localStorage.removeItem(SAVE_KEY);

  const levelReached = won ? maxLevel : currentLevel;
  const score = computeScore(levelReached, totalDistance, currentDifficulty);
  pendingRecord = { levelReached, score, diffKey: currentDifficulty, won };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'deck-dash', won, level: levelReached, score });
  }

  if (qualifiesForTop10(score)) {
    document.getElementById('name-title').innerText = won ? 'Victory! New Top 10 Record!' : 'New Top 10 Record!';
    document.getElementById('name-sub').innerText = `Level ${levelReached} · Score ${score}`;
    document.getElementById('name-overlay').style.display = 'flex';
    document.getElementById('name-input').value = '';
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  } else {
    showEndSummary(won, levelReached, score, null);
  }
}

function submitRecordName() {
  const input = document.getElementById('name-input');
  let name = input.value.trim();
  if (!name) name = 'Anonymous';
  name = name.slice(0, 14);

  const list = loadLeaderboard();
  const record = { name, level: pendingRecord.levelReached, score: pendingRecord.score, diff: pendingRecord.diffKey, date: new Date().toISOString().slice(0, 10) };
  list.push(record);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  saveLeaderboard(trimmed);

  document.getElementById('name-overlay').style.display = 'none';
  const rank = trimmed.indexOf(record);
  const isTop1 = rank === 0;

  showEndSummary(pendingRecord.won, pendingRecord.levelReached, pendingRecord.score, rank >= 0 ? rank + 1 : null);

  if (isTop1) {
    toast('New all-time #1! Capturing a screenshot for you...');
    setTimeout(() => captureGame(true), 500);
  }
}

function showEndSummary(won, level, score, rank) {
  document.getElementById('end-title').innerText = won ? 'Victory!' : 'Deck Crashed';
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  document.getElementById('end-summary').innerText =
    `${won ? 'You made it through all 10 levels.' : `You ran out of lives at Level ${level}.`} Score: ${score}.${rankLine}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

function openGuide() { document.getElementById('guide-overlay').style.display = 'flex'; }

function toast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

boot();
