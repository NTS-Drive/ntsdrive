const scoreEl = document.getElementById('score');
const stackEl = document.getElementById('paperStack');
const trayEl = document.getElementById('tray');
const approveBtn = document.getElementById('approveBtn');

let score = 0;
const MAX_VISIBLE_PAPERS = 10;

function addPaper() {
  const paper = document.createElement('div');
  paper.className = 'paper';
  const rot = (Math.random() * 10 - 5).toFixed(1);
  paper.style.setProperty('--rot', `${rot}deg`);
  const bottom = Math.min(score % MAX_VISIBLE_PAPERS, MAX_VISIBLE_PAPERS - 1) * 20;
  paper.style.bottom = `${bottom}px`;
  paper.style.left = `calc(50% + ${(Math.random() * 16 - 8).toFixed(0)}px)`;
  stackEl.appendChild(paper);

  if (stackEl.children.length > MAX_VISIBLE_PAPERS) {
    stackEl.removeChild(stackEl.firstChild);
  }
}

function stampFlash() {
  const flash = document.createElement('div');
  flash.className = 'stamp-flash';
  flash.textContent = 'Approved';
  const rect = approveBtn.getBoundingClientRect();
  flash.style.left = `${rect.left + rect.width / 2 - 55}px`;
  flash.style.top = `${rect.top - 30}px`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 350);
}

approveBtn.addEventListener('click', () => {
  score += 1;
  scoreEl.textContent = score.toLocaleString('ko-KR');
  addPaper();
  stampFlash();

  if (score === 1 && window.ntsTrack) {
    window.ntsTrack('title_engaged', { item_id: 'doc-stack-clicker' });
  }

  if (score % 50 === 0) {
    if (window.ntsTrack) {
      window.ntsTrack('milestone_reached', { item_id: 'doc-stack-clicker', count: score });
    }
    const combo = document.getElementById('combo');
    combo.textContent = `${score} processed. Keep going.`;
    combo.style.left = '50%';
    combo.style.bottom = '20%';
    combo.style.transform = 'translateX(-50%)';
    combo.classList.remove('show');
    void combo.offsetWidth;
    combo.classList.add('show');
  }
});
