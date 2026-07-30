/* ===== Shared across ask/index.html, ask/answer.html, ask/result.html, ask/myasks.html ===== */

function navigate(url) {
  document.body.classList.add('leaving');
  setTimeout(() => { window.location.href = url; }, 260);
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('leaving');
});
document.body.addEventListener('animationend', function onDone(e) {
  if (e.animationName === 'pageIn') document.body.classList.add('anim-settled');
});

const ASK_MIN = 3;
const ASK_MAX = 10;
const ASK_Q_MAX = 20;
const ASK_A_MAX = 30;
const ASK_NAME_MAX = 20;

/* ===== 모바일 한글(IME) 조합 중에는 maxlength가 무시되고 글자 수 제한을
   넘겨 입력이 계속되는 브라우저 버그가 있어, 조합 종료 시점에 한 번 더
   강제로 잘라낸다 (Post/Log와 동일한 패턴). 조합 상태는 로컬 Set으로 추적. ===== */
const askComposingKeys = new Set();
function askComposeStart(key) { askComposingKeys.add(key); }
function askEnforceMaxLen(inputEl, maxLen, key, onDone) {
  if (!askComposingKeys.has(key) && inputEl.value.length > maxLen) {
    inputEl.value = inputEl.value.slice(0, maxLen);
    toast(`최대 ${maxLen}자까지 입력할 수 있어요.`);
  }
  if (onDone) onDone();
}
function askComposeEnd(inputEl, maxLen, key, onDone) {
  askComposingKeys.delete(key);
  askEnforceMaxLen(inputEl, maxLen, key, onDone);
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
// escapeHtml()은 텍스트 노드 컨텍스트에서만 안전(따옴표는 이스케이프 안 됨).
// value="..." 같은 HTML 속성값 컨텍스트에 넣을 땐 반드시 이걸 쓴다 —
// 안 그러면 사용자가 입력한 텍스트에 " 가 섞였을 때 속성이 깨지고 임의
// 속성이 주입될 수 있다.
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ===== UTF-8 safe, URL-safe base64 + 경량 XOR 난독화 (Post/Log와 동일 방식) ===== */
const NTS_OBF_KEY = 'ntsdrive-2026-link-is-the-key';
function ntsXor(bytes) {
  const key = new TextEncoder().encode(NTS_OBF_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}
function encodeData(obj) {
  const json = JSON.stringify(obj);
  const bytes = ntsXor(new TextEncoder().encode(json));
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeData(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const json = new TextDecoder().decode(ntsXor(bytes));
  return JSON.parse(json);
}

function randomId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ===== 공유 — 클릭 즉시(공유 시트 열기 전) 미리 복사해두는 방식.
   Post/Log와 동일한 최신 패턴: 실패/취소 원인을 구분하지 않고 항상 안내로 통일 ===== */
function announceShareFallback() {
  const inapp = (typeof window !== 'undefined') ? window.NTSInAppBrowser : null;
  toast(inapp
    ? `${inapp.name} 안에서는 바로 공유가 안 돼서, 대신 링크를 복사했어요. 카카오톡 등 원하는 곳에 붙여넣어 보내주세요.`
    : '공유가 완료되지 않아 링크를 자동으로 복사해뒀어요. 원하는 곳에 붙여넣어 전달해주세요.');
  trackEvent('ask_link_copied', { inapp: !!inapp, fallback: true });
}
function shareLink(url) {
  navigator.clipboard.writeText(url).catch(() => {});
  if (navigator.share) {
    navigator.share({ url })
      .then(() => trackEvent('ask_link_shared', {}))
      .catch(() => announceShareFallback());
  } else {
    announceShareFallback();
  }
}

/* ===== GA4 helper (fails silently if gtag isn't loaded) ===== */
function trackEvent(name, params) {
  try {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  } catch (e) { /* no-op */ }
}

/* ===== 질문 풀 — 30개, 5개 카테고리 × 6개 (디자인 확정본 20260730 기준) ===== */
const ASK_CATEGORIES = ['취향', '성향', '추억', '요즘', '상상'];
const ASK_QUESTION_POOL = [
  { id: 1, cat: '취향', text: '제일 좋아하는 계절은?' },
  { id: 2, cat: '취향', text: '최애 음식 하나만 고른다면?' },
  { id: 3, cat: '취향', text: '요즘 제일 많이 듣는 노래는?' },
  { id: 4, cat: '취향', text: '여행은 계획파 vs 즉흥파?' },
  { id: 5, cat: '취향', text: '추천하는 유튜브 채널은?' },
  { id: 6, cat: '취향', text: '인생 영화 한 편 꼽는다면?' },
  { id: 7, cat: '성향', text: 'MBTI 알려줄래?' },
  { id: 8, cat: '성향', text: '아침형 vs 밤형?' },
  { id: 9, cat: '성향', text: '혼자 vs 같이, 뭐가 더 편해?' },
  { id: 10, cat: '성향', text: '스트레스 풀 때 뭐 해?' },
  { id: 11, cat: '성향', text: '결정할 때 직감파 vs 신중파?' },
  { id: 12, cat: '성향', text: '낯가림 있는 편이야?' },
  { id: 13, cat: '추억', text: '우리 처음 만난 날 기억나?' },
  { id: 14, cat: '추억', text: '우리가 친해진 계기, 기억나?' },
  { id: 15, cat: '추억', text: '나랑 있었던 일 중 제일 웃겼던 거?' },
  { id: 16, cat: '추억', text: '처음 본 내 인상 어땠어?' },
  { id: 17, cat: '추억', text: '같이 다시 가보고 싶은 곳 있어?' },
  { id: 18, cat: '추억', text: '나한테 서운했던 적 있어?' },
  { id: 19, cat: '요즘', text: '요즘 제일 관심 있는 거?' },
  { id: 20, cat: '요즘', text: '요즘 제일 자주 보는 콘텐츠는?' },
  { id: 21, cat: '요즘', text: '최근에 산 것 중 제일 만족스러운 거?' },
  { id: 22, cat: '요즘', text: '요즘 고민 있어?' },
  { id: 23, cat: '요즘', text: '요즘 취미 뭐야?' },
  { id: 24, cat: '요즘', text: '나한테 궁금한 거 있어?' },
  { id: 25, cat: '상상', text: '로또 되면 제일 먼저 할 일은?' },
  { id: 26, cat: '상상', text: '하루만 다른 사람이 될 수 있다면 누구?' },
  { id: 27, cat: '상상', text: '초능력 하나 가질 수 있다면?' },
  { id: 28, cat: '상상', text: '무인도에 하나만 가져간다면?' },
  { id: 29, cat: '상상', text: '타임머신 있으면 언제로 가고 싶어?' },
  { id: 30, cat: '상상', text: '다시 태어나면 뭘로 태어나고 싶어?' }
];

/* ===== 내 ASK함 저장소 ===== */
const ASK_STORAGE_KEY = 'ask_myasks_v1';

function loadMyAsks() {
  try {
    const raw = localStorage.getItem(ASK_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}
function saveMyAsks(list) {
  try { localStorage.setItem(ASK_STORAGE_KEY, JSON.stringify(list)); }
  catch (e) { toast('저장 공간이 부족해서 저장하지 못했어요.'); }
}

// A가 요청 생성 시: "보낸 ASK / 대기 중" 항목을 만든다.
function saveSentPending(id, questions, fromName, createdAt) {
  const list = loadMyAsks();
  if (list.some(item => item.id === id)) return; // 이미 있으면 중복 저장 안 함
  list.unshift({
    id, role: 'sent', status: 'pending',
    questions, answers: null,
    myName: fromName || '', otherName: '',
    createdAt, updatedAt: Date.now()
  });
  saveMyAsks(list);
}

// A가 B의 회신을 받았을 때: 매칭되는 "대기 중" 항목을 채우거나, 없으면 새로 만든다
// (기존 항목을 덮어쓰지 않는다 — 데이터 유실 방지가 최우선).
function completeSentAsk(replyPayload) {
  const list = loadMyAsks();
  const idx = list.findIndex(item => item.id === replyPayload.id && item.role === 'sent' && item.status === 'pending');
  let resultEntry;
  if (idx !== -1) {
    list[idx].status = 'done';
    list[idx].answers = replyPayload.answers;
    list[idx].questions = replyPayload.questions;
    list[idx].otherName = replyPayload.replyFrom || '';
    list[idx].updatedAt = Date.now();
    resultEntry = list[idx];
  } else {
    // 매칭되는 대기 항목이 없음(이미 완료됐거나, 같은 링크를 여러 명에게
    // 뿌린 경우) — 기존 데이터를 덮어쓰지 않고 새 항목으로 만든다. id를
    // 원본과 다르게(접미사 추가) 저장해서, 나중에 "내 ASK함"에서 같은 id를
    // 가진 다른 항목과 헷갈려 잘못 열리는 일이 없게 한다.
    resultEntry = {
      id: replyPayload.id + '_' + randomId(), role: 'sent', status: 'done',
      questions: replyPayload.questions, answers: replyPayload.answers,
      myName: replyPayload.from || '', otherName: replyPayload.replyFrom || '',
      createdAt: replyPayload.createdAt || Date.now(), updatedAt: Date.now()
    };
    list.unshift(resultEntry);
  }
  saveMyAsks(list);
  return resultEntry;
}

// B가 답변 제출 시: "받은 ASK / 완료" 항목을 즉시 만든다.
function saveReceivedDone(id, questions, answers, requesterName, myName) {
  const list = loadMyAsks();
  list.unshift({
    id: id + '_r_' + randomId(), role: 'received', status: 'done',
    questions, answers,
    myName: myName || '', otherName: requesterName || '',
    createdAt: Date.now(), updatedAt: Date.now()
  });
  saveMyAsks(list);
}

function removeAsk(id) {
  const list = loadMyAsks().filter(item => item.id !== id);
  saveMyAsks(list);
}

/* ===== 결과 화면(③) 공통 렌더러 — index.html(회신 열람)/answer.html(제출 직후)/
   myasks.html(재열람) 3곳에서 재사용 ===== */
function renderAskResultBlock(entry, isRequester) {
  const headerName = entry.otherName ? escapeHtml(entry.otherName) : '친구';
  const title = isRequester ? `${headerName}님의 답변이에요` : '내 답변이에요';
  const qa = entry.questions.map((q, i) => `
    <div class="ask-qa-block">
      <div class="ask-qa-q">Q${i + 1}. ${escapeHtml(q)}</div>
      <div class="ask-qa-a">${escapeHtml(entry.answers[i] || '')}</div>
    </div>
  `).join('');

  const ctaBlock = isRequester ? `
    <div class="ask-cta">
      <p>${headerName}님에게 이제 편지도 써볼까요?</p>
      <button class="seal-btn" onclick="navigate('../post/index.html')">Post로 이동하기</button>
    </div>
  ` : '';

  return `
    <div class="masthead" style="margin-bottom:24px;">
      <div class="kicker">💬 Ask</div>
      <h1 style="font-size:26px;">${title}</h1>
    </div>
    <div id="askResultCapture" class="ask-result-card">
      ${qa}
    </div>
    <div class="share-actions" style="margin-top:22px;">
      <button class="ghost-btn" style="flex:1;" onclick="saveAskCardImage()">저장하기</button>
      <button class="ghost-btn" style="flex:1;" onclick="shareAskCardImage()">공유하기</button>
    </div>
    ${ctaBlock}
  `;
}

/* ===== 카드 이미지 저장/공유 — 다이어리 주간 카드와 동일한 html2canvas 패턴,
   워터마크 없음(순수 추억 용도) ===== */
function captureAskCard() {
  const el = document.getElementById('askResultCapture');
  if (!el || typeof html2canvas === 'undefined') { toast('이미지를 만들지 못했어요.'); return Promise.reject(); }
  return html2canvas(el, { backgroundColor: '#F7F3EC', scale: 2 });
}
function isAskBlockedInApp() {
  if (typeof window !== 'undefined' && window.NTSInAppBrowser) {
    alert(`${window.NTSInAppBrowser.name} 안에서는 이미지를 저장·공유할 수 없어요. 주 사용 브라우저(사파리 또는 크롬)로 이동해서 다시 시도해주세요.`);
    trackEvent('ask_card_blocked_inapp', { app: window.NTSInAppBrowser.id });
    return true;
  }
  return false;
}
function saveAskCardImage() {
  if (isAskBlockedInApp()) return;
  trackEvent('ask_card_save_click', {});
  captureAskCard().then(canvas => {
    const link = document.createElement('a');
    link.download = `ask_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('이미지가 저장됐어요.');
  }).catch(() => toast('저장에 실패했어요.'));
}
function shareAskCardImage() {
  if (isAskBlockedInApp()) return;
  trackEvent('ask_card_share_click', {});
  captureAskCard().then(canvas => {
    canvas.toBlob(blob => {
      if (!blob) { toast('공유에 실패했어요.'); return; }
      const file = new File([blob], `ask_${Date.now()}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Ask' }).catch(() => {});
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
        toast('이 브라우저에서는 바로 공유가 안 돼서, 대신 이미지로 저장했어요.');
      }
    }, 'image/png');
  }).catch(() => toast('공유에 실패했어요.'));
}
