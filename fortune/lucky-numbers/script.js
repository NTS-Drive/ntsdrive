/* ===== Data ===== */
const NUM_COUNT = 5;
const NUM_MIN = 1;
const NUM_MAX = 99;
const DRAW_KEY = 'luckynum_draw';

const BONUS_ITEMS = [
  '네잎클로버', '노란 우산', '은색 열쇠고리', '따뜻한 아메리카노', '초록색 볼펜',
  '오래된 동전', '작은 다육이 화분', '줄무늬 양말', '민트색 머그컵', '반짝이는 스티커',
  '손글씨 메모지', '동그란 안경', '분홍색 포스트잇', '자그마한 인형', '레몬 향 캔들',
  '파란 우산', '별 모양 배지', '따뜻한 담요', '작은 종', '노트 한 권'
];

/* ===== Utilities ===== */
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function pickIndex(len) { return Math.floor(Math.random() * len); }
function loadDraw() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAW_KEY) || 'null');
    if (d && d.date === todayStr()) return d;
    return null;
  } catch (e) { return null; }
}
function saveDraw(d) { localStorage.setItem(DRAW_KEY, JSON.stringify(d)); }

function generateNumbers() {
  const nums = new Set();
  while (nums.size < NUM_COUNT) {
    nums.add(Math.floor(Math.random() * (NUM_MAX - NUM_MIN + 1)) + NUM_MIN);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

function drawToday() {
  const d = { date: todayStr(), numbers: generateNumbers(), bonusIdx: pickIndex(BONUS_ITEMS.length) };
  saveDraw(d);
  return d;
}

/* ===== Rendering ===== */
const stage = document.getElementById('stage');

function render() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('n') && params.has('b')) {
    renderSharedResult(params);
    return;
  }
  const existing = loadDraw();
  if (existing) {
    renderResult(existing, false);
  } else {
    renderDrawPrompt();
  }
}

function renderDrawPrompt() {
  stage.innerHTML = `
    <div class="hero-emoji">🍀</div>
    <div class="hero-title">오늘의 행운 넘버</div>
    <div class="hero-sub">클로버를 눌러 오늘의 숫자 5개를 뽑아보세요</div>
    <div class="disclaimer">🔔 이 콘텐츠는 순수하게 재미로 즐기는 랜덤 숫자 생성기입니다. 특정 복권 상품이나 사업자와 무관하며, 실제 당첨 확률과도 관련이 없습니다.</div>
    <div class="draw-btn-wrap">
      <button class="draw-btn" onclick="handleDraw()">🍀</button>
      <div class="draw-hint">오늘은 아직 안 뽑으셨어요</div>
    </div>
  `;
}

function handleDraw() {
  const d = drawToday();
  renderResult(d, true);
}

function renderResult(draw, isFresh) {
  const ballsHtml = draw.numbers.map(n => `<div class="ball">${n}</div>`).join('');
  const shareUrl = buildShareUrl(draw);

  stage.innerHTML = `
    <div class="hero-emoji">🍀</div>
    <div class="hero-title">오늘의 행운 넘버</div>
    <div class="hero-sub">${isFresh ? '오늘의 숫자가 나왔어요!' : '오늘 이미 뽑은 결과예요'}</div>
    ${isFresh ? '' : '<div class="locked-note">오늘은 이미 뽑으셨어요. 내일 다시 뽑을 수 있어요.</div>'}
    <div class="ball-row">${ballsHtml}</div>
    <div class="bonus-row">
      <div class="bonus-label">🎁 오늘의 행운템</div>
      <div class="bonus-value">${BONUS_ITEMS[draw.bonusIdx]}</div>
    </div>
    <div class="disclaimer">🔔 이 콘텐츠는 순수하게 재미로 즐기는 랜덤 숫자 생성기입니다. 특정 복권 상품이나 사업자와 무관하며, 실제 당첨 확률과도 관련이 없습니다.</div>
    <div class="share-row">
      <button class="action-btn primary" onclick="shareResult('${shareUrl}')">🔗 결과 공유하기</button>
    </div>
    <div class="footer-note">내일 다시 뽑을 수 있어요.</div>
  `;
}

function renderSharedResult(params) {
  const numbers = params.get('n').split('-').map(Number);
  const bonusIdx = parseInt(params.get('b'), 10);
  if (numbers.some(isNaN) || numbers.length !== NUM_COUNT || !BONUS_ITEMS[bonusIdx]) {
    stage.innerHTML = `<div class="hero-title">결과를 찾을 수 없어요</div>
      <div class="share-row"><button class="action-btn primary" onclick="location.href='index.html'">내 넘버 뽑으러 가기</button></div>`;
    return;
  }
  const ballsHtml = numbers.map(n => `<div class="ball">${n}</div>`).join('');
  stage.innerHTML = `
    <div class="hero-emoji">🍀</div>
    <div class="locked-note">누군가 나눠준 오늘의 행운 넘버예요 🍀</div>
    <div class="ball-row">${ballsHtml}</div>
    <div class="bonus-row">
      <div class="bonus-label">🎁 오늘의 행운템</div>
      <div class="bonus-value">${BONUS_ITEMS[bonusIdx]}</div>
    </div>
    <div class="disclaimer">🔔 이 콘텐츠는 순수하게 재미로 즐기는 랜덤 숫자 생성기입니다. 특정 복권 상품이나 사업자와 무관하며, 실제 당첨 확률과도 관련이 없습니다.</div>
    <div class="share-row">
      <button class="action-btn primary" onclick="location.href='index.html'">나도 뽑아보기</button>
    </div>
  `;
}

/* ===== Share ===== */
function buildShareUrl(draw) {
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('n', draw.numbers.join('-'));
  url.searchParams.set('b', draw.bonusIdx);
  return url.toString();
}
function shareResult(url) {
  if (navigator.share) {
    navigator.share({ title: '오늘의 행운 넘버', text: '오늘의 행운 넘버를 확인해보세요!', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => toast('링크가 복사됐어요!')).catch(() => toast('복사에 실패했어요.'));
  }
}

/* ===== Guide & toast ===== */
function openGuide() { document.getElementById('guide-overlay').style.display = 'flex'; }
function closeGuide() { document.getElementById('guide-overlay').style.display = 'none'; }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

render();
