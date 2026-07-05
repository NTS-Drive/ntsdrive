/* ===== Constants ===== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const maxLevel = 10;
const SAVE_KEY = 'dd_save';
const LEADERBOARD_KEY = 'dd_leaderboard';
const HIGH_LEVEL_KEY = 'dd_highLevel';
const GRAVITY = 0.9;
const JUMP_VELOCITY = -14;
const GROUND_MARGIN = 95;
const PLAYER_X = 90;
const PLAYER_W = 40;
const PLAYER_H_STAND = 51;
const PLAYER_H_DUCK = 30;
const INVULN_MS = 1200;
const WORD_OBSTACLE_W = 84;
const NUMBER_OBSTACLE_W = 65;
const OBSTACLE_H = 35;
const SHAPE_SIZE = 38;
const CHASER_SIZE = 32;
const FOOD_R = 18;
const FOOD_FONT = '30px sans-serif';
const FOOD_EMOJI = ['🍙', '🍎', '☕', '🍪', '🍱'];

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',        lives: 5, speedMult: 0.8, scoreBonus: 0 },
  manager:  { label: 'Manager (Normal)',     lives: 3, speedMult: 1.0, scoreBonus: 50 },
  director: { label: 'Director (Difficult)', lives: 2, speedMult: 1.3, scoreBonus: 150 }
};

/* Three acts: Word (1-3) -> Excel (4-7) -> PPT (8-10) */
const ACT_THEME = {
  word:  { label: 'Word',  obstacle: '#345f9e', chromeDark: '#28477a', grad: ['#eef1f6', '#fbfcfe'], decor: '#345f9e' },
  excel: { label: 'Excel', obstacle: '#3b8062', chromeDark: '#2c6249', grad: ['#e9f6ef', '#f7fdfa'], decor: '#3b8062' },
  ppt:   { label: 'PPT',   obstacle: '#c9793b', chromeDark: '#a35f28', grad: ['#fdece0', '#fff7f0'], decor: '#c9793b' }
};
function getAct(level) {
  if (level <= 3) return 'word';
  if (level <= 7) return 'excel';
  return 'ppt';
}
function applyActChrome(act) {
  const t = ACT_THEME[act];
  document.documentElement.style.setProperty('--chrome', t.obstacle);
  document.documentElement.style.setProperty('--chrome-dark', t.chromeDark);
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
let bonusScore = 0;
let obstacles = [];
let foods = [];
let bgDecor = [];
let floaters = [];
let lastSpawn = 0;
let lastFoodSpawn = 0;
let lastDecorSpawn = 0;
let spawnGap = 1400;
let gameEnded = false;
let enduranceMode = false;
const MAX_DISTANCE_M = 999999;
let invulnUntil = 0;
let pendingRecord = null;
let highLevelEver = parseInt(localStorage.getItem(HIGH_LEVEL_KEY) || '0', 10);
let lastAct = null;

const player = { y: 0, vy: 0, isJumping: false, isDucking: false, jumpCount: 0, maxJumps: 2 };

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentDifficulty = data.currentDifficulty || 'manager';
      currentLevel = data.currentLevel || 1;
      lives = data.lives != null ? data.lives : DIFFICULTIES[currentDifficulty].lives;
      enduranceMode = !!data.enduranceMode;
      totalDistance = data.totalDistance || 0;
      bonusScore = data.bonusScore || 0;
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
  bonusScore = 0;
  enduranceMode = false;
  obstacles = [];
  foods = [];
  bgDecor = [];
  floaters = [];
  document.getElementById('difficulty-overlay').style.display = 'none';
  init();
  updateUI();
}

function init() {
  resize();
  player.y = groundTop() - PLAYER_H_STAND;
  player.jumpCount = 0;
  gameEnded = false;
  obstacles = [];
  foods = [];
  bgDecor = [];
  floaters = [];
  lastSpawn = performance.now();
  lastFoodSpawn = performance.now();
  lastDecorSpawn = performance.now();
  lastAct = getAct(currentLevel);
  applyActChrome(lastAct);
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

/* ===== Input: double jump ===== */
function doJump() {
  if (gameEnded) return;
  if (player.isDucking) return;
  if (player.jumpCount < player.maxJumps) {
    player.vy = JUMP_VELOCITY;
    player.isJumping = true;
    player.jumpCount++;
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

/* ===== Obstacles: 3 lanes =====
   ground -> avoid with a (single) jump
   head   -> avoid by ducking; jumping through it is risky
   sky    -> only a double jump reaches this high; stay grounded or duck   */
function laneBox(lane, h) {
  const groundY = groundTop();
  if (lane === 'ground') return { y: groundY - h };
  // Bottom-anchored so the obstacle's lower edge stays fixed regardless of
  // its own height — this is what actually determines duck-safety.
  // head: bottom sits at groundY-35 (above duck-top at groundY-30, below
  // standing-top at groundY-51) so a standing runner is hit, a ducking one isn't.
  if (lane === 'head') return { y: groundY - 35 - h };
  // sky: bottom sits at groundY-185 — above a single jump's ~160 peak,
  // reachable only with the extra height from a double jump.
  return { y: groundY - 185 - h };
}
function pickLane() {
  const r = Math.random();
  if (currentLevel <= 1) return r < 0.75 ? 'ground' : 'head';
  if (currentLevel <= 3) return r < 0.55 ? 'ground' : r < 0.85 ? 'head' : 'sky';
  return r < 0.45 ? 'ground' : r < 0.75 ? 'head' : 'sky';
}

function currentSpeed() {
  const diff = DIFFICULTIES[currentDifficulty];
  return (4 + currentLevel * 0.4) * diff.speedMult;
}

function fitFontSize(text, maxWidth, maxSize, minSize) {
  let size = maxSize;
  ctx.font = `bold ${size}px 'IBM Plex Mono', monospace`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `bold ${size}px 'IBM Plex Mono', monospace`;
  }
  return size;
}

function spawnObstacle() {
  const act = getAct(currentLevel);
  const canChase = currentLevel > 5 && Math.random() < 0.22;

  if (canChase) {
    const groundY = groundTop();
    obstacles.push({ type: 'chaser', x: canvas.width + 20, y: groundY - CHASER_SIZE, w: CHASER_SIZE, h: CHASER_SIZE, speedMult: 1.5, lane: 'ground' });
    return;
  }

  const lane = pickLane();

  if (act === 'word') {
    const words = WORD_BANK[currentLevel] || WORD_BANK[1];
    const word = words[Math.floor(Math.random() * words.length)];
    const box = laneBox(lane, OBSTACLE_H);
    obstacles.push({ type: 'word', text: word, x: canvas.width + 20, y: box.y, w: WORD_OBSTACLE_W, h: OBSTACLE_H, speedMult: 1, lane });
    return;
  }

  if (act === 'excel') {
    if (currentLevel <= 5) {
      const digits = currentLevel === 4 ? 2 : 4;
      const num = String(Math.floor(Math.random() * Math.pow(10, digits)));
      const box = laneBox(lane, OBSTACLE_H);
      obstacles.push({ type: 'number', text: num, x: canvas.width + 20, y: box.y, w: NUMBER_OBSTACLE_W, h: OBSTACLE_H, speedMult: 1, lane });
    } else {
      const chartType = Math.random() < 0.5 ? 'bar' : 'pie';
      const chartH = SHAPE_SIZE + 18;
      const box = laneBox(lane, chartH);
      obstacles.push({ type: chartType, x: canvas.width + 20, y: box.y, w: SHAPE_SIZE + 12, h: chartH, speedMult: 1, lane });
    }
    return;
  }

  // ppt: shapes
  const shapes = ['circle', 'triangle', 'arrow', 'star'];
  const pool = shapes.slice(0, Math.min(shapes.length, currentLevel - 6));
  const shape = pool[Math.floor(Math.random() * pool.length)];
  const box = laneBox(lane, SHAPE_SIZE);
  obstacles.push({ type: shape, x: canvas.width + 20, y: box.y, w: SHAPE_SIZE, h: SHAPE_SIZE, speedMult: 1, lane });
}

/* ===== Food pickups (energy + score) ===== */
function spawnFood() {
  const groundY = groundTop();
  const highSpot = Math.random() < 0.5;
  foods.push({
    x: canvas.width + 20,
    y: highSpot ? groundY - 108 : groundY - 32,
    r: FOOD_R,
    emoji: FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)]
  });
}

function addFloater(x, y, text, color) {
  floaters.push({ x, y, text, color, life: 1 });
}

/* ===== Background decoration (parallax, non-colliding) ===== */
function spawnDecor(act) {
  const groundY = groundTop();
  if (act === 'word') {
    bgDecor.push({ x: canvas.width + 40, y: 30 + Math.random() * (groundY - 100), w: 60 + Math.random() * 60, h: 4, type: 'line' });
  } else if (act === 'excel') {
    bgDecor.push({ x: canvas.width + 40, y: 20 + Math.random() * (groundY - 90), w: 30 + Math.random() * 20, h: 20 + Math.random() * 30, type: 'cell' });
  } else {
    bgDecor.push({ x: canvas.width + 60, y: 10 + Math.random() * (groundY - 120), r: 20 + Math.random() * 30, type: 'blob' });
  }
}
function drawDecor(d, theme) {
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = theme.decor;
  if (d.type === 'line') {
    ctx.fillRect(d.x, d.y, d.w, d.h);
  } else if (d.type === 'cell') {
    ctx.strokeStyle = theme.decor;
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
  } else if (d.type === 'blob') {
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
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
    applyActChrome(act);
  }

  const groundY = groundTop();
  const speed = currentSpeed();

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, theme.grad[0]);
  grad.addColorStop(1, theme.grad[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (ts - lastDecorSpawn > 900) { spawnDecor(act); lastDecorSpawn = ts; }
  for (let i = bgDecor.length - 1; i >= 0; i--) {
    const d = bgDecor[i];
    d.x -= speed * 0.35;
    drawDecor(d, theme);
    if (d.x < -80) bgDecor.splice(i, 1);
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
    player.jumpCount = 0;
  }
  const pH = player.isDucking && !player.isJumping ? PLAYER_H_DUCK : PLAYER_H_STAND;
  const pY = player.isDucking && !player.isJumping ? groundY - PLAYER_H_DUCK : player.y;

  drawPlayer(pY, pH);

  // Spawns
  if (ts - lastSpawn > spawnGap) {
    spawnObstacle();
    lastSpawn = ts;
    let gap = Math.max(600, 1400 - currentLevel * 60 - Math.random() * 200);
    if (enduranceMode) gap = gap / 1.5; // 1.5x+ more obstacles from Level 10 onward
    spawnGap = gap;
  }
  if (!enduranceMode && ts - lastFoodSpawn > 3200 + Math.random() * 1600) {
    spawnFood();
    lastFoodSpawn = ts;
  }

  // Food: move, draw, collect
  const diff = DIFFICULTIES[currentDifficulty];
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    f.x -= speed;
    ctx.font = FOOD_FONT;
    ctx.textAlign = 'center';
    ctx.fillText(f.emoji, f.x, f.y + 9);
    ctx.textAlign = 'left';

    if (f.x < -20) { foods.splice(i, 1); continue; }

    const dx = (PLAYER_X + PLAYER_W / 2) - f.x;
    const dy = (pY + pH / 2) - f.y;
    if (Math.sqrt(dx * dx + dy * dy) < 32) {
      bonusScore += 30;
      if (lives < diff.lives) { lives++; }
      addFloater(f.x, f.y, '+30', '#2F8F5B');
      foods.splice(i, 1);
      updateUI();
    }
  }

  // Floating text
  for (let i = floaters.length - 1; i >= 0; i--) {
    const fl = floaters[i];
    fl.y -= 0.6;
    fl.life -= 0.02;
    ctx.globalAlpha = Math.max(0, fl.life);
    ctx.fillStyle = fl.color;
    ctx.font = "bold 17px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(fl.text, fl.x, fl.y);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    if (fl.life <= 0) floaters.splice(i, 1);
  }

  // Obstacles: move, draw, collide
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

  let distanceM = Math.floor(totalDistance / 10);
  if (distanceM >= MAX_DISTANCE_M) {
    distanceM = MAX_DISTANCE_M;
    totalDistance = MAX_DISTANCE_M * 10;
    document.getElementById('distance').textContent = `${distanceM.toLocaleString()} m`;
    endGame(true, true); // won=true, isMaster=true
    return;
  }
  document.getElementById('distance').textContent = `${distanceM.toLocaleString()} m`;
  document.getElementById('score-live').textContent =
    computeScore(Math.min(currentLevel, maxLevel), totalDistance, currentDifficulty, bonusScore).toLocaleString();

  if (!enduranceMode) {
    const levelTarget = 900 + currentLevel * 100;
    if (distanceInLevel >= levelTarget) {
      if (currentLevel < maxLevel) {
        currentLevel++;
        distanceInLevel = 0;
        document.getElementById('msg').textContent = `Level ${currentLevel} — deck scrolling faster.`;
        saveGame(false);
        updateUI();
      } else {
        enduranceMode = true;
        document.getElementById('msg').textContent = 'Endless mode — no more levels, just distance. Snacks stop appearing.';
        saveGame(false);
        updateUI();
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

/* ===== Drawing: office-worker character ===== */
function drawPlayer(pY, pH) {
  const invuln = performance.now() < invulnUntil;
  if (invuln && Math.floor(performance.now() / 100) % 2 === 0) return;

  const x = PLAYER_X;
  const isDuck = pH < PLAYER_H_STAND;
  const headR = isDuck ? 8 : 10;
  const bodyTop = pY + headR * 2 - 3;
  const bodyH = pH - (headR * 2 - 3);
  const bodyW = PLAYER_W;

  if (!player.isJumping) {
    const phase = Math.floor(totalDistance / 8) % 2;
    ctx.fillStyle = '#2b2f36';
    if (phase === 0) {
      ctx.fillRect(x + 4, pY + pH, 9, 9);
      ctx.fillRect(x + bodyW - 13, pY + pH, 9, 5);
    } else {
      ctx.fillRect(x + 4, pY + pH, 9, 5);
      ctx.fillRect(x + bodyW - 13, pY + pH, 9, 9);
    }
  } else if (player.jumpCount >= 2) {
    ctx.strokeStyle = 'rgba(47,93,168,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 3, pY + pH + 5); ctx.lineTo(x - 14, pY + pH + 13);
    ctx.moveTo(x + bodyW + 3, pY + pH + 5); ctx.lineTo(x + bodyW + 14, pY + pH + 13);
    ctx.stroke();
  }

  ctx.fillStyle = '#2c4a86';
  roundRect(x, bodyTop, bodyW, bodyH, 5);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + bodyW / 2 - 7, bodyTop);
  ctx.lineTo(x + bodyW / 2 + 7, bodyTop);
  ctx.lineTo(x + bodyW / 2, bodyTop + 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#a13a2c';
  ctx.beginPath();
  ctx.moveTo(x + bodyW / 2 - 3.5, bodyTop + 3);
  ctx.lineTo(x + bodyW / 2 + 3.5, bodyTop + 3);
  ctx.lineTo(x + bodyW / 2 + 2, bodyTop + bodyH * 0.6);
  ctx.lineTo(x + bodyW / 2, bodyTop + bodyH * 0.72);
  ctx.lineTo(x + bodyW / 2 - 2, bodyTop + bodyH * 0.6);
  ctx.closePath();
  ctx.fill();

  if (!isDuck) {
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(x + bodyW - 15, bodyTop + 8, 9, 12);
    ctx.fillStyle = '#2F5DA8';
    ctx.fillRect(x + bodyW - 15, bodyTop + 8, 9, 4);
  }

  const headCx = x + bodyW / 2;
  const headCy = pY + headR;
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath(); ctx.arc(headCx, headCy, headR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#3a2e26';
  ctx.beginPath();
  ctx.arc(headCx, headCy - headR * 0.15, headR * 1.02, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1e21';
  ctx.beginPath(); ctx.arc(headCx - headR * 0.35, headCy + 1, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headCx + headR * 0.35, headCy + 1, 1.5, 0, Math.PI * 2); ctx.fill();
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
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 + 6, 0, Math.PI * 2); ctx.stroke();
    return;
  }

  // Word obstacle: "paper" card with a folded corner — clearly a document, not a generic block.
  if (o.type === 'word') {
    const fold = 10;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = theme.obstacle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w - fold, o.y);
    ctx.lineTo(o.x + o.w, o.y + fold);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.lineTo(o.x, o.y + o.h);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = theme.obstacle;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w - fold, o.y);
    ctx.lineTo(o.x + o.w, o.y + fold);
    ctx.lineTo(o.x + o.w - fold, o.y + fold);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = theme.obstacle;
    ctx.textAlign = 'center';
    const size = fitFontSize(o.text, o.w - 14, 15, 9);
    ctx.font = `bold ${size}px 'IBM Plex Mono', monospace`;
    ctx.fillText(o.text, o.x + o.w / 2, o.y + o.h / 2 + size / 3);
    ctx.textAlign = 'left';
    return;
  }

  // Number obstacle: spreadsheet "cell" with a center divider line — clearly a cell, not a document.
  if (o.type === 'number') {
    ctx.fillStyle = theme.grad[0];
    ctx.strokeStyle = theme.obstacle;
    ctx.lineWidth = 2;
    roundRect(o.x, o.y, o.w, o.h, 3);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(o.x + o.w / 2, o.y + 3);
    ctx.lineTo(o.x + o.w / 2, o.y + o.h - 3);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = theme.obstacle;
    ctx.textAlign = 'center';
    const size = fitFontSize(o.text, o.w - 14, 16, 9);
    ctx.font = `bold ${size}px 'IBM Plex Mono', monospace`;
    ctx.fillText(o.text, o.x + o.w / 2, o.y + o.h / 2 + size / 3);
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
  const data = { lives, currentLevel, currentDifficulty, enduranceMode, totalDistance, bonusScore };
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
function computeScore(levelReached, distance, diffKey, bonus) {
  const diffBonus = DIFFICULTIES[diffKey] ? DIFFICULTIES[diffKey].scoreBonus : 0;
  return Math.floor(distance / 10) + levelReached * 200 + diffBonus + bonus;
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
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ink-muted);padding:20px;">No records yet — be the first.</td></tr>';
    return;
  }
  list.forEach((r, i) => {
    const tr = document.createElement('tr');
    const diffLabel = DIFFICULTIES[r.diff] ? DIFFICULTIES[r.diff].label.split(' (')[0] : r.diff;
    const distanceText = r.distanceM != null ? `${r.distanceM.toLocaleString()} m` : '—';
    const masterBadge = r.isMaster ? ' 🎉' : '';
    tr.innerHTML = `<td class="rank-cell">${i + 1}</td><td>${escapeHtml(r.name)}${masterBadge}</td><td>${r.level}/10</td><td>${distanceText}</td><td>${diffLabel}</td><td>${r.score.toLocaleString()}</td><td>${r.date}</td>`;
    body.appendChild(tr);
  });
}
function openLeaderboard() { renderLeaderboard(); document.getElementById('leaderboard-overlay').style.display = 'flex'; }
function closeOverlay(id) { document.getElementById(id).style.display = 'none'; }

/* ===== End of run ===== */
function endGame(won, isMaster) {
  gameEnded = true;
  localStorage.removeItem(SAVE_KEY);

  const levelReached = won ? maxLevel : currentLevel;
  const score = computeScore(levelReached, totalDistance, currentDifficulty, bonusScore);
  pendingRecord = { levelReached, score, diffKey: currentDifficulty, won, isMaster: !!isMaster };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'deck-dash', won, level: levelReached, score, master: !!isMaster });
  }

  if (qualifiesForTop10(score)) {
    document.getElementById('name-title').innerText = isMaster
      ? "You've Become a Master!"
      : (won ? 'Victory! New Top 10 Record!' : 'New Top 10 Record!');
    document.getElementById('name-sub').innerText = `Level ${levelReached} · Score ${score.toLocaleString()}`;
    document.getElementById('name-overlay').style.display = 'flex';
    document.getElementById('name-input').value = '';
    setTimeout(() => document.getElementById('name-input').focus(), 50);
  } else {
    showEndSummary(won, levelReached, score, null, isMaster);
  }
}

function submitRecordName() {
  const input = document.getElementById('name-input');
  let name = input.value.trim();
  if (!name) name = 'Anonymous';
  name = name.slice(0, 14);

  const list = loadLeaderboard();
  const record = {
    name,
    level: pendingRecord.levelReached,
    score: pendingRecord.score,
    diff: pendingRecord.diffKey,
    distanceM: Math.floor(totalDistance / 10),
    isMaster: pendingRecord.isMaster,
    date: new Date().toISOString().slice(0, 10)
  };
  list.push(record);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  saveLeaderboard(trimmed);

  document.getElementById('name-overlay').style.display = 'none';
  const rank = trimmed.indexOf(record);
  const isTop1 = rank === 0;

  showEndSummary(pendingRecord.won, pendingRecord.levelReached, pendingRecord.score, rank >= 0 ? rank + 1 : null, pendingRecord.isMaster);

  if (isTop1) {
    toast('New all-time #1! Capturing a screenshot for you...');
    setTimeout(() => captureGame(true), 500);
  }
}

function showEndSummary(won, level, score, rank, isMaster) {
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  if (isMaster) {
    document.getElementById('end-title').innerText = "🎉 You've Become a Master!";
    document.getElementById('end-summary').innerText =
      `Congratulations — you reached the maximum distance of 999,999m! Score: ${score.toLocaleString()}.${rankLine}`;
  } else {
    document.getElementById('end-title').innerText = won ? 'Home Safe!' : 'Deck Crashed';
    document.getElementById('end-summary').innerText =
      `${won ? 'You made it through Word, Excel, and PPT chaos and clocked out.' : `You ran out of lives at Level ${level}.`} Score: ${score.toLocaleString()}.${rankLine}`;
  }
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
