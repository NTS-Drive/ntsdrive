document.getElementById('year').textContent = new Date().getFullYear();

const BADGE_CLASS = {
  live: 'badge-live',
  testing: 'badge-testing',
  dev: 'badge-dev'
};

const historyGalleries = {};

function cardTemplate(p) {
  const badgeClass = BADGE_CLASS[p.status] || 'badge-dev';

  const thumbInner = p.thumbnail
    ? `<img src="${p.thumbnail}" alt="${p.name} 스크린샷" loading="lazy">`
    : `<span class="card-thumb-placeholder">${p.name} 스크린샷</span>`;

  const hasStore = p.appStore || p.playStore;
  const storesHTML = `
    <div class="card-stores ${hasStore ? '' : 'is-empty'}">
      ${p.appStore ? `<a class="store-link" href="${p.appStore}" aria-label="App Store" data-project="${p.id}" data-store="ios"><i class="ti ti-brand-apple" aria-hidden="true"></i>App Store</a>` : ''}
      ${p.playStore ? `<a class="store-link" href="${p.playStore}" aria-label="Google Play" data-project="${p.id}" data-store="android"><i class="ti ti-brand-google-play" aria-hidden="true"></i>Google Play</a>` : ''}
    </div>`;

  let historyHTML = '';
  if (p.history) {
    if (p.history.gallery && p.history.gallery.length) {
      historyGalleries[p.id] = p.history.gallery;
      historyHTML = `
        <div class="card-history">
          <img class="card-history-icon" src="${p.history.icon}" alt="${p.name} 히스토리 아이콘" loading="lazy">
          <button type="button" class="card-history-trigger" data-history-project="${p.id}">${p.history.note}</button>
        </div>`;
    } else {
      historyHTML = `<div class="card-history"><span class="card-history-trigger" style="text-decoration:none;cursor:default;">${p.history.note}</span></div>`;
    }
  }

  return `
    <article class="card" id="project-${p.id}">
      <div class="card-thumb">${thumbInner}</div>
      <div class="card-body">
        <div class="card-head">
          <span class="card-name">${p.name}</span>
          <span class="badge ${badgeClass}">${p.statusLabel}</span>
        </div>
        <span class="card-category">${p.category}</span>
        <p class="card-desc">${p.description}</p>
        <a class="card-link" href="${p.url}" data-project="${p.id}" data-dest="${p.hosting}">${p.urlLabel}</a>
        ${storesHTML}
        ${historyHTML}
      </div>
    </article>
  `;
}

/* ---------- history gallery modal ---------- */

let currentGallery = [];
let currentIndex = 0;

function buildModal() {
  const modal = document.createElement('div');
  modal.className = 'history-modal';
  modal.id = 'history-modal';
  modal.innerHTML = `
    <div class="history-modal-panel-wrap">
      <button type="button" class="history-modal-close" id="history-modal-close">닫기</button>
      <div class="history-modal-panel">
        <div class="history-modal-image-wrap">
          <img id="history-modal-img" src="" alt="">
        </div>
        <div class="history-modal-footer">
          <p class="history-modal-caption" id="history-modal-caption"></p>
          <div class="history-modal-nav">
            <button type="button" id="history-modal-prev">이전</button>
            <span class="history-modal-count" id="history-modal-count"></span>
            <button type="button" id="history-modal-next">다음</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('history-modal-close').addEventListener('click', closeModal);
  document.getElementById('history-modal-prev').addEventListener('click', () => showSlide(currentIndex - 1));
  document.getElementById('history-modal-next').addEventListener('click', () => showSlide(currentIndex + 1));
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
    if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
  });
}

function showSlide(index) {
  if (index < 0 || index >= currentGallery.length) return;
  currentIndex = index;
  const item = currentGallery[currentIndex];
  document.getElementById('history-modal-img').src = item.src;
  document.getElementById('history-modal-img').alt = item.caption;
  document.getElementById('history-modal-caption').textContent = item.caption;
  document.getElementById('history-modal-count').textContent = `${currentIndex + 1} / ${currentGallery.length}`;
  document.getElementById('history-modal-prev').disabled = currentIndex === 0;
  document.getElementById('history-modal-next').disabled = currentIndex === currentGallery.length - 1;
}

function openModal(projectId) {
  currentGallery = historyGalleries[projectId] || [];
  if (!currentGallery.length) return;
  document.getElementById('history-modal').classList.add('is-open');
  showSlide(0);
}

function closeModal() {
  document.getElementById('history-modal').classList.remove('is-open');
}

function track(eventName, params) {
  if (typeof window.ntsTrack === 'function') {
    window.ntsTrack(eventName, params);
  }
}

fetch('data/projects.json?v=1')
  .then((res) => res.json())
  .then((projects) => {
    const container = document.getElementById('projects');
    container.innerHTML = projects.map(cardTemplate).join('');

    buildModal();
    document.querySelectorAll('[data-history-project]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openModal(btn.dataset.historyProject);
        track('project_history_expand', { project_id: btn.dataset.historyProject });
      });
    });
    document.querySelectorAll('.card-link').forEach((el) => {
      el.addEventListener('click', () => {
        track('project_card_click', { project_id: el.dataset.project, destination: el.dataset.dest });
      });
    });
    document.querySelectorAll('.store-link').forEach((el) => {
      el.addEventListener('click', () => {
        track('project_store_click', { project_id: el.dataset.project, store: el.dataset.store });
      });
    });
  })
  .catch((err) => {
    console.error('프로젝트 데이터를 불러오지 못했습니다.', err);
  });
