const BEST_LEVEL_KEY = 'pm_best_level';
const TOTAL_LEVELS = 10;
const QUESTIONS_PER_LEVEL = 8;
const TOTAL_LIVES = 3;

let WORD_POOL = [];
let levelQuestions = [];
let currentLevel = 1;
let currentQuestionIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let lives = TOTAL_LIVES;
let timerInterval = null;
let timeRemaining = 0;
let answered = false;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadWords() {
  const res = await fetch('words.json', { cache: 'no-store' });
  WORD_POOL = await res.json();
  document.getElementById('poolInfo').textContent = `${WORD_POOL.length} pictures across ${TOTAL_LEVELS} levels`;
  document.getElementById('bestLevelLabel').textContent = localStorage.getItem(BEST_LEVEL_KEY) || '0';
}

function timeForLevel(level) {
  return Math.max(6000, 12000 - (level - 1) * 700);
}
function optionCountForLevel(level) {
  if (level <= 3) return 3;
  if (level <= 7) return 4;
  return 5;
}

function startRun() {
  currentLevel = 1;
  score = 0;
  streak = 0;
  bestStreak = 0;
  lives = TOTAL_LIVES;

  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('summaryScreen').classList.remove('active');
  document.getElementById('quizScreen').classList.add('active');

  if (window.ntsTrack) window.ntsTrack('quiz_start', { item_id: 'picture-match' });

  loadLevelQuestions();
}

function loadLevelQuestions() {
  const pool = WORD_POOL.filter(w => w.level === currentLevel);
  levelQuestions = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);
  currentQuestionIndex = 0;
  document.getElementById('levelBadge').textContent = `Level ${currentLevel} / ${TOTAL_LEVELS}`;
  document.getElementById('themeLabel').textContent = levelQuestions[0] ? levelQuestions[0].theme : '';
  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex >= levelQuestions.length) {
    if (currentLevel < TOTAL_LEVELS) {
      currentLevel++;
      loadLevelQuestions();
    } else {
      endRun(true);
    }
    return;
  }

  answered = false;
  const current = levelQuestions[currentQuestionIndex];

  document.getElementById('questionCount').textContent = `Word ${currentQuestionIndex + 1} / ${levelQuestions.length}`;
  document.getElementById('scoreLive').textContent = `Score: ${score}`;
  document.getElementById('emojiDisplay').textContent = current.emoji;
  document.getElementById('streakBadge').style.display = 'none';
  document.getElementById('livesRow').textContent = '♥ '.repeat(Math.max(0, lives)).trim() || 'No lives left';

  const optionCount = optionCountForLevel(currentLevel);
  const others = WORD_POOL.filter(w => w.answer !== current.answer);
  const distractors = shuffle(others).slice(0, optionCount - 1).map(w => w.answer);
  const options = shuffle([current.answer, ...distractors]);

  const list = document.getElementById('optionsList');
  list.innerHTML = '';
  options.forEach(optionText => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = optionText;
    btn.onclick = () => handleAnswer(optionText, current.answer, btn);
    list.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  const total = timeForLevel(currentLevel);
  timeRemaining = total;
  const fill = document.getElementById('timerFill');
  fill.style.width = '100%';
  fill.classList.remove('warn');

  timerInterval = setInterval(() => {
    timeRemaining -= 100;
    const pct = Math.max(0, (timeRemaining / total) * 100);
    fill.style.width = pct + '%';
    if (timeRemaining <= total * 0.25) fill.classList.add('warn');
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (!answered) handleAnswer(null, levelQuestions[currentQuestionIndex].answer, null);
    }
  }, 100);
}

function handleAnswer(selectedText, correctText, btnEl) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === correctText) b.classList.add('correct');
  });

  const isCorrect = selectedText === correctText;
  if (isCorrect) {
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    const bonus = streak >= 3 ? 5 : 0;
    score += 10 + bonus;
    const badge = document.getElementById('streakBadge');
    if (streak >= 2) {
      badge.style.display = 'inline-block';
      badge.textContent = `🔥 ${streak} in a row${bonus ? ' · +5 bonus' : ''}`;
    }
  } else {
    streak = 0;
    lives--;
    if (btnEl) btnEl.classList.add('wrong');
    document.getElementById('livesRow').textContent = lives > 0 ? '♥ '.repeat(lives).trim() : 'No lives left';
  }

  document.getElementById('scoreLive').textContent = `Score: ${score}`;

  setTimeout(() => {
    if (lives <= 0) {
      endRun(false);
      return;
    }
    currentQuestionIndex++;
    showQuestion();
  }, 900);
}

function endRun(won) {
  document.getElementById('quizScreen').classList.remove('active');
  document.getElementById('summaryScreen').classList.add('active');

  const levelReached = won ? TOTAL_LEVELS : currentLevel;
  document.getElementById('summaryTitle').textContent = won ? 'All Levels Cleared!' : 'Out of Lives';
  document.getElementById('statLevel').textContent = `${levelReached}/${TOTAL_LEVELS}`;
  document.getElementById('statScore').textContent = score;
  document.getElementById('statStreak').textContent = bestStreak;

  const prevBest = parseInt(localStorage.getItem(BEST_LEVEL_KEY) || '0', 10);
  const newBestLine = document.getElementById('newBestLine');
  if (levelReached > prevBest) {
    localStorage.setItem(BEST_LEVEL_KEY, levelReached);
    document.getElementById('bestLevelLabel').textContent = levelReached;
    newBestLine.style.display = 'block';
  } else {
    newBestLine.style.display = 'none';
  }

  if (window.ntsTrack) {
    window.ntsTrack('quiz_complete', { item_id: 'picture-match', level: levelReached, score, best_streak: bestStreak });
  }
}

loadWords();
