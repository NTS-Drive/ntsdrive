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
const PLAYER_W = 30;
const PLAYER_H_STAND = 38;
const PLAYER_H_DUCK = 22;
const INVULN_MS = 1200;

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',        lives: 5, speedMult: 0.8, scoreBonus: 0 },
  manager:  { label: 'Manager (Normal)',     lives: 3, speedMult: 1.0, scoreBonus: 50 },
  director: { label: 'Director (Difficult)', lives: 2, speedMult: 1.3, scoreBonus: 150 }
};

/* Three acts: Word (1-3) -> Excel (4-7) -> PPT (8-10) */
const ACT_THEME = {
  word:  { label: 'Word',  bg: '#f5f6f8', obstacle: '#345f9e' },
  excel: { label: 'Excel', bg: '#f2f8f5', obstacle: '#3b8062' },
  ppt:   { label: 'PPT',   bg: '#fbf4ee', obstacle: '#c9793b' }
};
function getAct(level) {
  if (level <= 3) return 'word';
  if (level <= 7) return 'excel';
  return 'ppt';
}

const WORD_BANK = {
  1: ['OK', 'CC', 'FYI', 'ASAP', 'TBD'],
  2: ['URGENT', 'REVISE', 'APPROVE', 'CIRCLE BACK'],
  3: ['DEADLINE', 'ATTACHMENT', 'RESCHEDULE', 'STAKEHOLDER']
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
let lastAct = null;

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
  lastAct = getAct(currentLevel);
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
  const act = getAct(currentLevel);
  const canChase = currentLevel > 5 && Math.random() < 0.22;

  if (canChase) {
    obstacles.push({ type: 'chaser', x: canvas.width + 20, y: groundY - 24, w: 24, h: 24, speedMult: 1.5 });
    return;
  }

  if (act === 'word') {
    const words = WORD_BANK[currentLevel] || WORD_BANK[1];
    const word = words[Math.floor(Math.random() * words.length)];
    const w = 22 + word.length * 9;
    obstacles.push({ type: 'word', text: word, x: canvas.width + 20, y: groundY - 26, w, h: 26, speedMult: 1 });
    return;
  }

  if (act === 'excel') {
    if (currentLevel <= 5) {
      const digits = currentLevel === 4 ? 2 : 4;
      const num = String(Math.floor(Math.random() * Math.pow(10, digits)));
      const w = 20 + num.length * 12;
      obstacles.push({ type: 'number', text: num, x: canvas.width + 20, y: groundY - 26, w, h: 26, speedMult: 1 });
    } else {
      const chartType = Math.random() < 0.5 ? 'bar' : 'pie';
      obstacles.push({ type: chartType, x: canvas.width + 20, y: groundY - 70, w: 34, h: 42, speedMult: 1 });
    }
    return;
  }

  // ppt: shapes — pool grows as levels progress so "star" appears by Lv10
  const shapes = ['circle', 'triangle', 'arrow', 'star'];
  const pool = shapes.slice(0, Math.min(shapes.length, currentLevel - 6));
  const shape = pool[Math.floor(Math.random() * pool.length)];
  const isHigh = Math.random() < 0.35;
  const size = 28;
  obstacles.push({
    type: shape, x: canvas.width + 20,
    y: isHigh ? groundY - 66 : groundY - size,
    w: size, h: size, speedMult: 1
  });
}

/* ===== Main loop ===== */
function gameLoop(ts) {
  if (gameEnded) return;
  const act = getAct(currentLevel);
  const theme = ACT_THEME[act];

  if (act !== lastAct) {
    document.getElementById('msg').textContent = `New act: ${theme.label} mode.`;
    lastAct = act;
    document.getElementById('act-label').textContent = theme.label;
  }

  const groundY = groundTop();
  const speed = currentSpeed();

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
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
    drawObstacle(o, theme);

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

/* ===== Drawing: office-worker character ===== */
function drawPlayer(pY, pH) {
  const invuln = performance.now() < invulnUntil;
  if (invuln && Math.floor(performance.now() / 100) % 2 === 0) return; // blink when invulnerable

  const x = PLAYER_X;
  const isDuck = pH < PLAYER_H_STAND;
  const headR = isDuck ? 6 : 7;
  const bodyTop = pY + headR * 2 - 2;
  const bodyH = pH - (headR * 2 - 2);
  const bodyW = PLAYER_W;

  // legs (drawn first, behind body)
  if (!player.isJumping) {
    const phase = Math.floor(totalDistance / 8) % 2;
    ctx.fillStyle = '#2b2f36'; // dark trousers
    if (phase === 0) {
      ctx.fillRect(x + 3, pY + pH, 7, 7);
      ctx.fillRect(x + bodyW - 10, pY + pH, 7, 4);
    } else {
      ctx.fillRect(x + 3, pY + pH, 7, 4);
      ctx.fillRect(x + bodyW - 10, pY + pH, 7, 7);
    }
  }

  // body / blazer
  ctx.fillStyle = '#2c4a86';
  roundRect(x, bodyTop, bodyW, bodyH, 5);
  ctx.fill();

  // shirt collar (small white triangle at neck)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + bodyW / 2 - 5, bodyTop);
  ctx.lineTo(x + bodyW / 2 + 5, bodyTop);
  ctx.lineTo(x + bodyW / 2, bodyTop + 7);
  ctx.closePath();
  ctx.fill();

  // necktie
  ctx.fillStyle = '#a13a2c';
  ctx.beginPath();
  ctx.moveTo(x + bodyW / 2 - 2.5, bodyTop + 2);
  ctx.lineTo(x + bodyW / 2 + 2.5, bodyTop + 2);
  ctx.lineTo(x + bodyW / 2 + 1.5, bodyTop + bodyH * 0.6);
  ctx.lineTo(x + bodyW / 2, bodyTop + bodyH * 0.72);
  ctx.lineTo(x + bodyW / 2 - 1.5, bodyTop + bodyH * 0.6);
  ctx.closePath();
  ctx.fill();

  // ID badge (only when standing tall enough to show it)
  if (!isDuck) {
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(x + bodyW - 11, bodyTop + 6, 7, 9);
    ctx.fillStyle = '#2F5DA8';
    ctx.fillRect(x + bodyW - 11, bodyTop + 6, 7, 3);
  }

  // head
  const headCx = x + bodyW / 2;
  const headCy = pY + headR;
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath(); ctx.arc(headCx, headCy, headR, 0, Math.PI * 2); ctx.fill();

  // hair
  ctx.fillStyle = '#3a2e26';
  ctx.beginPath();
  ctx.arc(headCx, headCy - headR * 0.15, headR * 1.02, Math.PI, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = '#1b1e21';
  ctx.beginPath(); ctx.arc(headCx - headR * 0.35, headCy + 1, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headCx + headR * 0.35, headCy + 1, 1.1, 0, Math.PI * 2); ctx.fill();
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

/* ===== Drawing: obstacles per act ===== */
function drawObstacle(o, theme) {
  if (o.type === 'chaser') {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(192,57,43,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 + 5, 0, Math.PI * 2); ctx.stroke();
    return;
  }

  if (o.type === 'word' || o.type === 'number') {
    ctx.fillStyle = theme.obstacle;
    roundRect(o.x, o.y, o.w, o.h, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(o.text, o.x + o.w / 2, o.y + o.h / 2 + 4);
    ctx.textAlign = 'left';
    return;
  }

  if (o.type === 'bar') {
    ctx.fillStyle = theme.obstacle;
    const bw = o.w / 4;
    [0.4, 0.7, 1, 0.55].forEach((h, i) => {
      ctx.fillRect(o.x + i * bw, o.y + o.h * (1 - h), bw - 2, o.h * h);
    });
    return;
  }

  if (o.type === 'pie') {
    ctx.fillStyle = theme.obstacle;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w / 2, o.y + o.h / 2);
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, -Math.PI / 2, Math.PI * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = theme.obstacle;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2); ctx.stroke();
    return;
  }

  ctx.fillStyle = theme.obstacle;
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2, r = o.w / 2;
  if (o.type === 'circle') {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx - r, cy + r);
    ctx.closePath(); ctx.fill();
  } else if (o.type === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.3); ctx.lineTo(cx + r * 0.2, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.2, cy - r); ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx + r * 0.2, cy + r); ctx.lineTo(cx + r * 0.2, cy + r * 0.3);
    ctx.lineTo(cx - r, cy + r * 0.3); ctx.closePath(); ctx.fill();
  } else if (o.type === 'star') {
    const spikes = 5, outerR = r, innerR = r * 0.45;
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath(); ctx.fill();
  }
}

/* ===== UI ===== */
function updateUI() {
  document.getElementById('lives').textContent = Math.max(0, lives);
  document.getElementById('level').textContent = `${currentLevel} / ${maxLevel}`;
  document.getElementById('diff-label').textContent = DIFFICULTIES[currentDifficulty].label.split(' (')[0];
  document.getElementById('act-label').textContent = ACT_THEME[getAct(currentLevel)].label;

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
    `${won ? 'You survived Word, Excel, and PPT chaos all the way through.' : `You ran out of lives at Level ${level}.`} Score: ${score}.${rankLine}`;
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
