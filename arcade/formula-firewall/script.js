/* ===== Constants ===== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 45;
const maxLevel = 10;
const SAVE_KEY = 'ff_save';
const LEADERBOARD_KEY = 'ff_leaderboard';
const HIGH_LEVEL_KEY = 'ff_highLevel';

const DIFFICULTIES = {
  intern:   { label: 'Intern (Easy)',       budget: 1200, speedMult: 0.8,  hpMult: 0.8,  scoreBonus: 0 },
  manager:  { label: 'Manager (Normal)',    budget: 800,  speedMult: 1.0,  hpMult: 1.0,  scoreBonus: 50 },
  director: { label: 'Director (Difficult)',budget: 500,  speedMult: 1.3,  hpMult: 1.25, scoreBonus: 150 }
};

const towerSpecs = {
  VLOOKUP: { cost: 100, range: 140, damage: 15, color: '#2c4a86', rate: 700 },
  IFERROR: { cost: 150, range: 110, damage: 8,  color: '#b9770e', rate: 250 },
  SUMIF:   { cost: 250, range: 250, damage: 70, color: '#a13a2c', rate: 1800 }
};

/* ===== State ===== */
let money = 800;
let health = 100;
let currentLevel = 1;
let currentDifficulty = 'manager';
let isWaveActive = false;
let gameEnded = false;
let pendingRecord = null;
let highLevelEver = parseInt(localStorage.getItem(HIGH_LEVEL_KEY) || '0', 10);

let towers = [];
let enemies = [];
let bullets = [];
let path = [];
let selectedTowerType = null;

let backgroundData = [];
let simRow = 0;
let simCol = 0;
let lastSimTime = 0;
const SIM_INTERVAL = 1200;

/* ===== Boot ===== */
function boot() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentDifficulty = data.currentDifficulty || 'manager';
      money = data.money;
      health = data.health;
      currentLevel = data.currentLevel;
      document.getElementById('difficulty-overlay').style.display = 'none';
      init();
      towers = (data.towers || []).map(t => ({ ...t, ...towerSpecs[t.type], lastShot: 0 }));
      updateUI();
      toast(`Welcome back! Resuming as ${DIFFICULTIES[currentDifficulty].label} — Level ${currentLevel}`);
      return;
    } catch (e) {
      localStorage.removeItem(SAVE_KEY);
    }
  }
  // No save: difficulty-overlay is already visible by default in the HTML.
}

function startGame(diffKey) {
  currentDifficulty = diffKey;
  const diff = DIFFICULTIES[diffKey];
  money = diff.budget;
  health = 100;
  currentLevel = 1;
  document.getElementById('difficulty-overlay').style.display = 'none';
  init();
  updateUI();
}

function init() {
  resize();
  initBackgroundData();
  createPath();
  gameEnded = false;
  gameLoop();
}

function resize() {
  const chromeHeight = document.getElementById('chrome').offsetHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - chromeHeight;
}

function initBackgroundData() {
  const cols = Math.ceil(canvas.width / CELL_SIZE);
  const rows = Math.floor(canvas.height / CELL_SIZE);
  backgroundData = Array.from({ length: rows }, () => Array(cols).fill(''));
}

/* ===== Background "work" simulation (achromatic, like a real document) ===== */
function updateWorkSimulation(timestamp) {
  if (timestamp - lastSimTime > SIM_INTERVAL) {
    const rows = backgroundData.length;
    const cols = backgroundData[0] ? backgroundData[0].length : 0;

    if (simRow < rows && cols > 0) {
      const types = [
        (Math.random() * 5000).toFixed(0),
        '2026-07-04',
        'CONFIRMED',
        (Math.random() * 100).toFixed(1) + '%',
        'P-' + Math.floor(Math.random() * 1000)
      ];
      backgroundData[simRow][simCol] = types[Math.floor(Math.random() * types.length)];

      const colLetter = String.fromCharCode(65 + (simCol % 26));
      document.getElementById('active-cell').innerText = colLetter + (simRow + 1);
      document.getElementById('formula-input').value = backgroundData[simRow][simCol];

      simCol++;
      if (simCol >= cols) {
        simCol = 0;
        simRow++;
      }
    }
    lastSimTime = timestamp;
  }
}

/* ===== Path ===== */
function createPath() {
  path = [];
  const cols = Math.ceil(canvas.width / CELL_SIZE);
  const rows = Math.floor(canvas.height / CELL_SIZE);
  const startRow = Math.floor(rows / 2);
  let currentRow = startRow;

  for (let c = 0; c < cols; c++) {
    if (currentLevel > 1 && c > 0 && c % 3 === 0) {
      const move = Math.floor(Math.random() * 3) - 1;
      const nextRow = currentRow + move;
      if (Math.abs(nextRow - startRow) <= 2) currentRow = nextRow;
    }
    path.push({ x: c * CELL_SIZE + CELL_SIZE / 2, y: currentRow * CELL_SIZE + CELL_SIZE / 2 });
  }
}

/* ===== Tower placement ===== */
function selectTower(type) {
  selectedTowerType = type;
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-' + type).classList.add('selected');
  document.getElementById('formula-input').value = `=DEPLOY_TOWER("${type}")`;
}

canvas.addEventListener('mousedown', e => {
  if (!selectedTowerType || gameEnded) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);

  if (path.some(p => Math.floor(p.x / CELL_SIZE) === col && Math.floor(p.y / CELL_SIZE) === row)) return;
  if (towers.some(t => Math.floor(t.x / CELL_SIZE) === col && Math.floor(t.y / CELL_SIZE) === row)) return;

  const spec = towerSpecs[selectedTowerType];
  if (money >= spec.cost) {
    money -= spec.cost;
    towers.push({
      x: col * CELL_SIZE + CELL_SIZE / 2,
      y: row * CELL_SIZE + CELL_SIZE / 2,
      type: selectedTowerType,
      lastShot: 0,
      ...spec
    });
    updateUI();
  }
});

/* ===== Waves & enemies ===== */
function startWave() {
  if (isWaveActive || gameEnded) return;
  isWaveActive = true;
  document.getElementById('start-btn').disabled = true;
  document.getElementById('msg').innerText = 'Threat detected — macro defenses engaged.';

  let spawned = 0;
  const spawnCount = 6 + currentLevel * 4;
  const interval = Math.max(200, 1000 - currentLevel * 50);
  const spawnInterval = setInterval(() => {
    spawnEnemy();
    spawned++;
    if (spawned >= spawnCount) clearInterval(spawnInterval);
  }, interval);
}

function spawnEnemy() {
  const diff = DIFFICULTIES[currentDifficulty];
  const errors = ['#REF!', '#VALUE!', '#DIV/0!', '#NAME?', '#NULL!'];
  const type = errors[Math.floor(Math.random() * errors.length)];
  const hp = (50 + currentLevel * 55) * diff.hpMult;
  const canAttack = currentLevel > 5;
  const attackDamage = canAttack ? Math.round((currentLevel - 5) * 4 * diff.hpMult) : 0;

  enemies.push({
    pathIdx: 0,
    x: path[0].x,
    y: path[0].y,
    hp,
    maxHp: hp,
    speed: (1.2 + currentLevel * 0.15) * diff.speedMult,
    text: type,
    canAttack,
    attackDamage,
    lastAttack: 0
  });
}

/* ===== Main loop ===== */
function gameLoop(timestamp) {
  if (gameEnded) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateWorkSimulation(timestamp || 0);
  drawGrid();
  drawPath();

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const target = path[enemy.pathIdx];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      enemy.pathIdx++;
      if (enemy.pathIdx >= path.length) {
        health -= (8 + currentLevel);
        enemies.splice(i, 1);
        updateUI();
        checkWaveEnd();
        continue;
      }
    } else {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }

    // From Level 6 onward, threats near a tower actively attack it.
    if (enemy.canAttack) {
      let minDist = Infinity;
      towers.forEach(t => {
        const d = Math.hypot(t.x - enemy.x, t.y - enemy.y);
        if (d < minDist) minDist = d;
      });
      if (minDist < 34) {
        const now = Date.now();
        if (now - enemy.lastAttack > 900) {
          health -= enemy.attackDamage;
          enemy.lastAttack = now;
          updateUI();
        }
        ctx.strokeStyle = 'rgba(161,58,44,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#a13a2c';
    ctx.font = "bold 12px 'IBM Plex Mono', monospace";
    ctx.fillText(enemy.text, enemy.x - 20, enemy.y + 5);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 4);
    ctx.fillStyle = '#4a8f5c';
    ctx.fillRect(enemy.x - 15, enemy.y - 15, (enemy.hp / enemy.maxHp) * 30, 4);
  }

  const now = Date.now();
  towers.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.arc(t.x, t.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = "bold 10px 'IBM Plex Mono', monospace";
    ctx.fillText(t.type[0], t.x - 4, t.y + 4);

    if (now - t.lastShot > t.rate) {
      const target = enemies.find(e => Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2) < t.range);
      if (target) {
        bullets.push({ x: t.x, y: t.y, target, damage: t.damage, color: t.color });
        t.lastShot = now;
      }
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = b.target.x - b.x;
    const dy = b.target.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 6 || !enemies.includes(b.target)) {
      if (enemies.includes(b.target)) {
        b.target.hp -= b.damage;
        if (b.target.hp <= 0) {
          enemies.splice(enemies.indexOf(b.target), 1);
          money += 30;
          updateUI();
          checkWaveEnd();
        }
      }
      bullets.splice(i, 1);
    } else {
      b.x += (dx / dist) * 14;
      b.y += (dy / dist) * 14;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - (dx / dist) * 10, b.y - (dy / dist) * 10); ctx.stroke();
    }
  }

  requestAnimationFrame(gameLoop);
}

function checkWaveEnd() {
  if (isWaveActive && enemies.length === 0) {
    isWaveActive = false;
    document.getElementById('start-btn').disabled = false;

    if (currentLevel < maxLevel) {
      document.getElementById('msg').innerText = `Level ${currentLevel} cleared. Auto-saving...`;
      currentLevel++;
      saveGame(false);
      createPath();
      updateUI();
    } else {
      document.getElementById('msg').innerText = 'All levels cleared!';
      endGame(true);
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.fillStyle = '#666';
  for (let i = 0; i < canvas.width; i += CELL_SIZE) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }
  for (let j = 0; j < canvas.height; j += CELL_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
  }
  backgroundData.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      if (val) ctx.fillText(val, cIdx * CELL_SIZE + 5, rIdx * CELL_SIZE + 28);
    });
  });
}

function drawPath() {
  ctx.fillStyle = 'rgba(230, 235, 242, 0.6)';
  path.forEach(p => {
    ctx.fillRect(p.x - CELL_SIZE / 2 + 1, p.y - CELL_SIZE / 2 + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  });
}

/* ===== UI ===== */
function updateUI() {
  document.getElementById('money').innerText = `${money} $`;
  document.getElementById('level').innerText = `${currentLevel} / ${maxLevel}`;
  document.getElementById('diff-label').innerText = DIFFICULTIES[currentDifficulty].label.split(' (')[0];

  if (currentLevel > highLevelEver) {
    highLevelEver = currentLevel;
    localStorage.setItem(HIGH_LEVEL_KEY, highLevelEver);
  }
  document.getElementById('high-score').innerText = highLevelEver;

  if (health <= 0 && !gameEnded) {
    health = 0;
    document.getElementById('health').innerText = '0%';
    endGame(false);
    return;
  }
  document.getElementById('health').innerText = `${Math.max(0, Math.round(health))}%`;
}

/* ===== Save / Load / Reset ===== */
function saveGame(manual) {
  const data = {
    money, health, currentLevel, currentDifficulty,
    towers: towers.map(t => ({ x: t.x, y: t.y, type: t.type }))
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  if (manual) toast('Progress saved.');
}

function resetGame() {
  if (confirm('Reset your current run? Saved progress will be cleared. Your Top 10 records are kept.')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

/* ===== Screenshot capture ===== */
function captureGame(silent) {
  html2canvas(document.getElementById('capture-area')).then(canvas => {
    const link = document.createElement('a');
    link.download = `FormulaFirewall_Lv${currentLevel}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    if (!silent) toast('Screenshot saved to your device.');
  });
}

/* ===== Leaderboard ===== */
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveLeaderboard(list) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
}
function computeScore(levelReached, healthRemaining, diffKey) {
  const bonus = DIFFICULTIES[diffKey] ? DIFFICULTIES[diffKey].scoreBonus : 0;
  return levelReached * 1000 + Math.round(healthRemaining) * 5 + bonus;
}
function qualifiesForTop10(score) {
  const list = loadLeaderboard();
  if (list.length < 10) return true;
  return score > list[list.length - 1].score;
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.innerText = str;
  return d.innerHTML;
}
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
function openLeaderboard() {
  renderLeaderboard();
  document.getElementById('leaderboard-overlay').style.display = 'flex';
}
function closeOverlay(id) {
  document.getElementById(id).style.display = 'none';
}

/* ===== End of game flow ===== */
function endGame(won) {
  gameEnded = true;
  isWaveActive = false;
  localStorage.removeItem(SAVE_KEY);

  const levelReached = won ? maxLevel : currentLevel;
  const score = computeScore(levelReached, Math.max(health, 0), currentDifficulty);
  pendingRecord = { levelReached, score, diffKey: currentDifficulty, won };

  if (window.ntsTrack) {
    window.ntsTrack('title_milestone', { item_id: 'formula-firewall', won, level: levelReached, score });
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
  const record = {
    name,
    level: pendingRecord.levelReached,
    score: pendingRecord.score,
    diff: pendingRecord.diffKey,
    date: new Date().toISOString().slice(0, 10)
  };
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
  document.getElementById('end-title').innerText = won ? 'Victory!' : 'System Breach';
  const rankLine = rank ? ` Ranked #${rank} on the leaderboard.` : '';
  document.getElementById('end-summary').innerText =
    `${won ? 'You cleared all 10 levels.' : `You were breached at Level ${level}.`} Score: ${score}.${rankLine}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

/* ===== Guide & boss key ===== */
function openGuide() {
  document.getElementById('guide-overlay').style.display = 'flex';
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const boss = document.getElementById('boss-screen');
    boss.style.display = (boss.style.display === 'flex') ? 'none' : 'flex';
  }
});

/* ===== Toast ===== */
function toast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ===== Go ===== */
boot();
