document.getElementById('year').textContent = new Date().getFullYear();

const ASSET_VERSION = 'v3';
function withV(path) {
  if (!path) return path;
  return `${path}?v=${ASSET_VERSION}`;
}

function track(eventName, params) {
  if (typeof window.ntsTrack === 'function') {
    window.ntsTrack(eventName, params);
  }
}

let allProjects = [];
let currentSort = 'newest';
let currentStatus = 'all';

function sortProjects(projects, mode) {
  const copy = projects.slice();
  if (mode === 'az') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  }
  return copy;
}

function filterProjects(projects, status) {
  if (status === 'all') return projects;
  return projects.filter((p) => p.status === status);
}

function rowTemplate(p) {
  const thumbInner = p.thumbnail
    ? `<img class="row-thumb" src="${withV(p.thumbnail)}" alt="${p.name} screenshot" loading="lazy">`
    : `<div class="row-thumb-placeholder">${p.name}</div>`;

  return `
    <div class="row" data-project="${p.id}" role="button" tabindex="0">
      <div class="row-main">
        <div class="row-title-line">
          <span class="row-status">${p.statusLabel}</span>
          <p class="row-title">${p.name}</p>
        </div>
        <p class="row-desc">${p.description}</p>
        <div class="row-meta">
          <span class="row-date">Released ${p.releaseDateLabel}</span>
          <span class="row-tag">${p.category}</span>
        </div>
      </div>
      ${thumbInner}
    </div>
  `;
}

function renderRows() {
  const container = document.getElementById('projects');
  const filtered = filterProjects(allProjects, currentStatus);
  const sorted = sortProjects(filtered, currentSort);
  container.innerHTML = sorted.map(rowTemplate).join('');

  document.querySelectorAll('.row').forEach((row) => {
    row.addEventListener('click', () => openDetail(row.dataset.project));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail(row.dataset.project);
      }
    });
  });
}

document.querySelectorAll('.status-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentStatus = btn.dataset.status;
    document.querySelectorAll('.status-btn').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderRows();
    track('project_status_filter', { status: currentStatus });
  });
});

const filterBtn = document.getElementById('filter-btn');
const filterMenu = document.getElementById('filter-menu');
const filterBtnLabel = document.getElementById('filter-btn-label');

filterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = filterMenu.classList.toggle('is-open');
  filterBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.addEventListener('click', () => {
  filterMenu.classList.remove('is-open');
  filterBtn.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.filter-option').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentSort = btn.dataset.sort;
    filterBtnLabel.textContent = btn.textContent;
    document.querySelectorAll('.filter-option').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    filterMenu.classList.remove('is-open');
    filterBtn.setAttribute('aria-expanded', 'false');
    renderRows();
    track('project_sort_change', { sort: currentSort });
  });
});

/* ---------- detail modal ---------- */

let currentGallery = [];
let currentGalleryIndex = 0;

function buildModal() {
  const modal = document.createElement('div');
  modal.className = 'detail-modal';
  modal.id = 'detail-modal';
  modal.innerHTML = `
    <div class="detail-panel-wrap">
      <button type="button" class="detail-close" id="detail-close">Close</button>
      <div class="detail-panel" id="detail-panel"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDetail();
  });
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
  });
}

function closeDetail() {
  document.getElementById('detail-modal').classList.remove('is-open');
}

function openDetail(projectId) {
  const p = allProjects.find((item) => item.id === projectId);
  if (!p) return;

  const toolsHTML = (p.tools && p.tools.length)
    ? `<div class="detail-tools">${p.tools.map((t) => `<span class="tool-chip">${t}</span>`).join('')}</div>`
    : '';

  const hasStore = p.appStore || p.playStore;
  const storesHTML = `
    <div class="detail-stores ${hasStore ? '' : 'is-empty'}">
      ${p.appStore ? `<a class="store-link" href="${p.appStore}" target="_blank" rel="noopener noreferrer" aria-label="App Store"><i class="ti ti-brand-apple" aria-hidden="true"></i>App Store</a>` : ''}
      ${p.playStore ? `<a class="store-link" href="${p.playStore}" target="_blank" rel="noopener noreferrer" aria-label="Google Play"><i class="ti ti-brand-google-play" aria-hidden="true"></i>Google Play</a>` : ''}
    </div>`;

  const historyHTML = p.history ? `
    <div class="detail-history">
      <p class="detail-history-label">Archive</p>
      <div class="detail-history-header">
        <img class="detail-history-icon" src="${withV(p.history.icon)}" alt="">
        <p class="detail-history-note">${p.history.note}</p>
      </div>
      <div class="history-gallery-image-wrap">
        <img id="gallery-img" src="" alt="">
      </div>
      <p class="history-gallery-caption" id="gallery-caption"></p>
      <div class="history-gallery-nav">
        <button type="button" id="gallery-prev">Prev</button>
        <span class="history-gallery-count" id="gallery-count"></span>
        <button type="button" id="gallery-next">Next</button>
      </div>
    </div>
  ` : '';

  document.getElementById('detail-panel').innerHTML = `
    ${p.logo ? `<img class="detail-logo" src="${withV(p.logo)}" alt="${p.name} logo">` : ''}
    <div class="detail-name-line">
      <p class="detail-name">${p.name}</p>
      <span class="row-badge">${p.statusLabel}</span>
    </div>
    <p class="detail-category">${p.category} &middot; Released ${p.releaseDateLabel}</p>
    ${toolsHTML}
    ${storesHTML}
    ${p.url ? `<a class="detail-visit" href="${p.url}" target="_blank" rel="noopener noreferrer" data-project="${p.id}">${p.urlLabel}</a>` : ''}
    <p class="detail-desc">${p.detail || p.description}</p>
    ${p.screenshot ? `<img class="detail-screenshot" src="${withV(p.screenshot)}" alt="${p.name} screenshot">` : ''}
    ${historyHTML}
  `;

  const visitLink = document.querySelector('.detail-visit');
  if (visitLink) {
    visitLink.addEventListener('click', () => track('project_card_click', { project_id: p.id, destination: p.hosting }));
  }
  document.querySelectorAll('.store-link').forEach((el) => {
    el.addEventListener('click', () => track('project_store_click', { project_id: p.id }));
  });

  if (p.history) {
    currentGallery = p.history.gallery;
    currentGalleryIndex = 0;
    showGallerySlide(0);
    document.getElementById('gallery-prev').addEventListener('click', () => showGallerySlide(currentGalleryIndex - 1));
    document.getElementById('gallery-next').addEventListener('click', () => showGallerySlide(currentGalleryIndex + 1));
  }

  document.getElementById('detail-modal').classList.add('is-open');
  track('project_detail_open', { project_id: p.id });
}

function showGallerySlide(index) {
  if (index < 0 || index >= currentGallery.length) return;
  currentGalleryIndex = index;
  const item = currentGallery[currentGalleryIndex];
  document.getElementById('gallery-img').src = withV(item.src);
  document.getElementById('gallery-img').alt = item.caption;
  document.getElementById('gallery-caption').textContent = item.caption;
  document.getElementById('gallery-count').textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
  document.getElementById('gallery-prev').disabled = currentGalleryIndex === 0;
  document.getElementById('gallery-next').disabled = currentGalleryIndex === currentGallery.length - 1;
}

fetch('data/projects.json?v=1790301917')
  .then((res) => res.json())
  .then((projects) => {
    allProjects = projects;
    renderRows();
    buildModal();
  })
  .catch((err) => {
    console.error('Could not load project data.', err);
  });
