const BEST_LEVEL_KEY = 'eh_best_level';
const TOTAL_LEVELS = 10;
const DIGITS = ['0','1','2','3','4','5','6','7','8','9'];
const OPS = ['+','-','*','/'];
const OP_SYMBOL = { '+':'+', '-':'\u2212', '*':'\u00d7', '/':'\u00f7' };

let currentLevel = 1;
let score = 0;
let length = 5;
let maxGuesses = 8;
let attemptsUsed = 0;
let targetEquation = '';
let targetValue = 0;
let currentGuess = [];
let rows = [];
let runEnded = false;

/* ===== Safe evaluator (digits + - * / only, no parentheses) ===== */
function evalExpression(str) {
  const tokens = str.split('');
  // pass 1: * and /
  let stack = [Number(tokens[0])];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = Number(tokens[i + 1]);
    if (op === '*') {
      stack.push(stack.pop() * num);
    } else if (op === '/') {
      const prev = stack.pop();
      if (num === 0) return null;
      stack.push(prev / num);
    } else {
      stack.push(op);
      stack.push(num);
    }
  }
  // pass 2: + and - left to right
  let result = stack[0];
  for (let i = 1; i < stack.length; i += 2) {
    const op = stack[i];
    const num = stack[i + 1];
    result = op === '+' ? result + num : result - num;
  }
  return result;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePuzzle(len) {
  const numCount = (len + 1) / 2;
  for (let attempt = 0; attempt < 300; attempt++) {
    const tokens = [String(randInt(1, 9))];
    for (let i = 1; i < numCount; i++) {
      tokens.push(OPS[Math.floor(Math.random() * OPS.length)]);
      tokens.push(String(randInt(1, 9)));
    }
    const eq = tokens.join('');
    const val = evalExpression(eq);
    if (val !== null && Number.isInteger(val) && val >= 0 && val <= 200) {
      return { equation: eq, target: val };
    }
  }
  // Guaranteed-valid fallback
  const tokens = ['1'];
  for (let i = 1; i < numCount; i++) { tokens.push('+'); tokens.push('1'); }
  return { equation: tokens.join(''), target: numCount };
}

function levelConfig(level) {
  if (level <= 3) return { length: 5, guesses: 8 };
  if (level <= 7) return { length: 7, guesses: 6 };
  return { length: 9, guesses: 5 };
}

/* ===== Run flow ===== */
function startRun() {
  currentLevel = 1;
  score = 0;
  runEnded = false;
  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('summaryScreen').classList.remove('active');
  document.getElementById('quizScreen').classList.add('active');

  if (window.ntsTrack) window.ntsTrack('quiz_start', { item_id: 'equation-hunt' });

  document.getElementById('bestLevel').textContent = localStorage.getItem(BEST_LEVEL_KEY) || '0';
  loadLevel();
}

function loadLevel() {
  const cfg = levelConfig(currentLevel);
  length = cfg.length;
  maxGuesses = cfg.guesses;
  attemptsUsed = 0;
  currentGuess = [];

  const puzzle = generatePuzzle(length);
  targetEquation = puzzle.equation;
  targetValue = puzzle.target;

  document.getElementById('level').textContent = `${currentLevel} / ${TOTAL_LEVELS}`;
  document.getElementById('targetDisplay').textContent = targetValue;
  document.getElementById('guessesLeft').textContent = maxGuesses;
  document.getElementById('msg').textContent = `${length}-character calculation. Find it.`;

  buildGrid();
  buildKeypad();
  updateKeypadState();
}

function buildGrid() {
  const wrap = document.getElementById('gridWrap');
  wrap.innerHTML = '';
  rows = [];
  for (let r = 0; r < maxGuesses; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'guess-row';
    const cells = [];
    for (let c = 0; c < length; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      rowEl.appendChild(cell);
      cells.push(cell);
    }
    wrap.appendChild(rowEl);
    rows.push(cells);
  }
}

function buildKeypad() {
  const row1 = document.getElementById('digitRow1');
  const row2 = document.getElementById('digitRow2');
  const opRow = document.getElementById('opRow');
  row1.innerHTML = ''; row2.innerHTML = ''; opRow.innerHTML = '';

  DIGITS.slice(0, 5).forEach(d => row1.appendChild(makeKey(d, d)));
  DIGITS.slice(5).forEach(d => row2.appendChild(makeKey(d, d)));
  OPS.forEach(op => opRow.appendChild(makeKey(OP_SYMBOL[op], op, true)));
}

function makeKey(label, value, isOp) {
  const btn = document.createElement('button');
  btn.className = 'key' + (isOp ? ' op' : '');
  btn.textContent = label;
  btn.dataset.value = value;
  btn.onclick = () => pressKey(value);
  return btn;
}

function isDigit(ch) { return DIGITS.includes(ch); }

function updateKeypadState() {
  const nextIsDigit = currentGuess.length % 2 === 0;
  const full = currentGuess.length >= length;
  document.querySelectorAll('.key[data-value]').forEach(btn => {
    const val = btn.dataset.value;
    const valIsDigit = isDigit(val);
    btn.disabled = full || (valIsDigit !== nextIsDigit);
  });
  document.getElementById('enterBtn').disabled = !full;
  document.getElementById('deleteBtn').disabled = currentGuess.length === 0;
}

function renderActiveRow() {
  const cells = rows[attemptsUsed];
  cells.forEach((cell, i) => {
    cell.textContent = currentGuess[i] ? (OP_SYMBOL[currentGuess[i]] || currentGuess[i]) : '';
    cell.classList.toggle('filled', !!currentGuess[i]);
  });
}

function pressKey(value) {
  if (runEnded || currentGuess.length >= length) return;
  const nextIsDigit = currentGuess.length % 2 === 0;
  if (isDigit(value) !== nextIsDigit) return;
  currentGuess.push(value);
  renderActiveRow();
  updateKeypadState();
}

function pressDelete() {
  if (runEnded || currentGuess.length === 0) return;
  currentGuess.pop();
  renderActiveRow();
  updateKeypadState();
}

function pressEnter() {
  if (runEnded || currentGuess.length !== length) return;
  const guessStr = currentGuess.join('');
  const feedback = scoreGuess(guessStr, targetEquation);
  paintRow(attemptsUsed, guessStr, feedback);

  attemptsUsed++;
  const guessesLeft = maxGuesses - attemptsUsed;
  document.getElementById('guessesLeft').textContent = Math.max(0, guessesLeft);

  const solved = guessStr === targetEquation;

  if (solved) {
    score += guessesLeft * 10 + currentLevel * 20;
    if (currentLevel < TOTAL_LEVELS) {
      document.getElementById('msg').textContent = `Level ${currentLevel} solved! Loading next level...`;
      setTimeout(() => { currentLevel++; loadLevel(); }, 1100);
    } else {
      setTimeout(() => endRun(true), 800);
    }
    return;
  }

  if (guessesLeft <= 0) {
    setTimeout(() => endRun(false), 800);
    return;
  }

  currentGuess = [];
  updateKeypadState();
}

/* Wordle-style feedback with duplicate-character handling */
function scoreGuess(guess, target) {
  const result = new Array(guess.length).fill('absent');
  const targetChars = target.split('');
  const used = new Array(target.length).fill(false);

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
      used[i] = true;
      targetChars[i] = null;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue;
    const idx = targetChars.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = 'present';
      targetChars[idx] = null;
    }
  }
  return result;
}

function paintRow(rowIndex, guessStr, feedback) {
  const cells = rows[rowIndex];
  guessStr.split('').forEach((ch, i) => {
    cells[i].textContent = OP_SYMBOL[ch] || ch;
    cells[i].classList.remove('filled');
    cells[i].classList.add(feedback[i]);
  });
}

/* ===== End of run ===== */
function endRun(won) {
  runEnded = true;
  document.getElementById('quizScreen').classList.remove('active');
  document.getElementById('summaryScreen').classList.add('active');

  const levelReached = won ? TOTAL_LEVELS : currentLevel;
  document.getElementById('summaryTitle').textContent = won ? 'All Levels Solved!' : 'Out of Guesses';
  document.getElementById('revealLine').textContent = won ? '' : `The hidden calculation was ${targetEquation.replace(/[+\-*/]/g, m => OP_SYMBOL[m])} = ${targetValue}`;
  document.getElementById('statLevel').textContent = `${levelReached}/${TOTAL_LEVELS}`;
  document.getElementById('statScore').textContent = score;

  const prevBest = parseInt(localStorage.getItem(BEST_LEVEL_KEY) || '0', 10);
  const newBestLine = document.getElementById('newBestLine');
  if (levelReached > prevBest) {
    localStorage.setItem(BEST_LEVEL_KEY, levelReached);
    newBestLine.style.display = 'block';
  } else {
    newBestLine.style.display = 'none';
  }

  if (window.ntsTrack) {
    window.ntsTrack('quiz_complete', { item_id: 'equation-hunt', level: levelReached, score });
  }
}

/* ===== Guide & input ===== */
function openGuide() { document.getElementById('guide-overlay').classList.add('show'); }
function closeGuide() { document.getElementById('guide-overlay').classList.remove('show'); }

window.addEventListener('keydown', e => {
  if (document.getElementById('guide-overlay').classList.contains('show')) return;
  if (document.getElementById('quizScreen').classList.contains('active') === false) return;
  if (/^[0-9]$/.test(e.key)) pressKey(e.key);
  else if (e.key === '+' ) pressKey('+');
  else if (e.key === '-') pressKey('-');
  else if (e.key === '*' || e.key === 'x') pressKey('*');
  else if (e.key === '/') pressKey('/');
  else if (e.key === 'Enter') pressEnter();
  else if (e.key === 'Backspace') pressDelete();
});
