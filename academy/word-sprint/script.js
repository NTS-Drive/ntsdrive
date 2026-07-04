const BEST_KEY = 'ws_best_score';
const ROUND_SIZE = 10;
const TIME_PER_Q = 10000; // ms

let WORD_POOL = [];
let roundWords = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let correctCount = 0;
let timerInterval = null;
let timeRemaining = TIME_PER_Q;
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
  document.getElementById('poolInfo').textContent = `${WORD_POOL.length} words in this pack — Business English Essentials`;
  document.getElementById('bestScoreLabel').textContent = localStorage.getItem(BEST_KEY) || '0';
}

function startRound() {
  const size = Math.min(ROUND_SIZE, WORD_POOL.length);
  roundWords = shuffle(WORD_POOL).slice(0, size);
  currentIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  correctCount = 0;

  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('summaryScreen').classList.remove('active');
  document.getElementById('quizScreen').classList.add('active');

  if (window.ntsTrack) window.ntsTrack('quiz_start', { item_id: 'word-sprint' });

  showQuestion();
}

function showQuestion() {
  if (currentIndex >= roundWords.length) {
    endRound();
    return;
  }
  answered = false;
  const current = roundWords[currentIndex];

  document.getElementById('questionCount').textContent = `Question ${currentIndex + 1} / ${roundWords.length}`;
  document.getElementById('scoreLive').textContent = `Score: ${score}`;
  document.getElementById('termLabel').textContent = current.term;
  document.getElementById('streakBadge').style.display = 'none';

  // Build 3 distractors from other pool entries, avoiding duplicate text.
  const others = WORD_POOL.filter(w => w.term !== current.term);
  const distractors = shuffle(others).slice(0, 3).map(w => w.definition);
  const options = shuffle([current.definition, ...distractors]);

  const list = document.getElementById('optionsList');
  list.innerHTML = '';
  options.forEach(optionText => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = optionText;
    btn.onclick = () => handleAnswer(optionText, current.definition, btn);
    list.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeRemaining = TIME_PER_Q;
  const fill = document.getElementById('timerFill');
  fill.style.width = '100%';
  fill.classList.remove('warn');

  timerInterval = setInterval(() => {
    timeRemaining -= 100;
    const pct = Math.max(0, (timeRemaining / TIME_PER_Q) * 100);
    fill.style.width = pct + '%';
    if (timeRemaining <= 3000) fill.classList.add('warn');
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (!answered) handleAnswer(null, roundWords[currentIndex].definition, null);
    }
  }, 100);
}

function handleAnswer(selectedText, correctText, btnEl) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correctText) b.classList.add('correct');
  });

  const isCorrect = selectedText === correctText;
  if (isCorrect) {
    correctCount++;
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
    if (btnEl) btnEl.classList.add('wrong');
  }

  document.getElementById('scoreLive').textContent = `Score: ${score}`;

  setTimeout(() => {
    currentIndex++;
    showQuestion();
  }, 900);
}

function endRound() {
  document.getElementById('quizScreen').classList.remove('active');
  document.getElementById('summaryScreen').classList.add('active');

  const accuracy = Math.round((correctCount / roundWords.length) * 100);
  document.getElementById('statScore').textContent = score;
  document.getElementById('statAccuracy').textContent = accuracy + '%';
  document.getElementById('statStreak').textContent = bestStreak;

  const prevBest = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  const newBestLine = document.getElementById('newBestLine');
  if (score > prevBest) {
    localStorage.setItem(BEST_KEY, score);
    document.getElementById('bestScoreLabel').textContent = score;
    newBestLine.style.display = 'block';
  } else {
    newBestLine.style.display = 'none';
  }

  if (window.ntsTrack) {
    window.ntsTrack('quiz_complete', { item_id: 'word-sprint', score, accuracy, best_streak: bestStreak });
  }
}

loadWords();
