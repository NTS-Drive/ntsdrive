# ntsdrive.com v80 — 포트폴리오 전환 작업 요약

> 기준: 업로드해주신 `ntsdrive_v79_full.zip` → 전면 재구축
> 이 zip은 v79의 후속 **전체 사이트 트리**입니다 (부분 변경 아님, 통째로 교체).

## 삭제한 것

기존 실서비스 기능 전체와 관련 자산을 삭제했습니다.

- 기능 폴더: `/post/`, `/log/`, `/diary/`, `/snap/`, `/film/`, `/ask/`, `/album/`, `/moment/`, `/settings/`, `/remind/`, `/camera/`
- 콘텐츠 페이지: `/guide/`, `/philosophy/`
- 정책 페이지: `/privacy/`, `/terms/`
- 문의 페이지: `/contact/` — **일단 삭제했는데, 포트폴리오에도 연락 수단(이메일 등)을 넣을지 아직 답을 못 받아서 임의로 판단했어요. 필요하면 간단한 형태로 다시 넣을게요.**
- PWA 관련 전체: `manifest.json`, `/icons/`, `/splash/`, `install-shortcut.js` — 포트폴리오는 "홈 화면에 추가"할 앱이 아니라서 제거
- 기타 전용 로직: `dday.js`, `categories.json`, `fonts.css`(손글씨 폰트), `inapp-warning.js`, `backup-reminder.js`, `feedback-widget.js`
- `ads.txt` — AdSense 중단 결정에 따라 제거
- `SEO_SETUP_GUIDE.md` — 내부 메모라 배포본에서 제외 (원본은 Min님 쪽에 남아있을 거예요)
- `assets/appicon-source.svg`, `assets/hero-bg.jpg` — 옛 앱 전용 자산

## 유지한 것

- `CNAME` — 도메인 연결 그대로
- `favicon.ico` / `favicon.svg` — 액체유리 폴더 로고를 **개인 브랜드 아이콘으로 재사용**
- `analytics.js` — GA4 로더 그대로 재사용 (측정 ID 동일), 34개 옛 이벤트는 코드에서 다 같이 삭제됐고 새 이벤트만 남음

## 새로 만든 것

- `index.html` / `styles.css` / `script.js` — Quiet Builder 톤 포트폴리오 홈
- `data/projects.json` — waaait / comecame 카드 (자산 도착 전 placeholder 상태)
- `assets/history/` — NTS Drive 히스토리 갤러리 이미지 6장 (아이콘 + 스크린샷 6장)
- `robots.txt` / `sitemap.xml` — 루트 URL 하나만 남긴 최소 구성
- GA4 이벤트 4종 연결 완료: `project_card_click`, `project_store_click`, `project_history_expand`, (내부호스팅 서비스용 `internal_project_visit`은 1호 서비스 나올 때 같이 추가)

## 아직 결정 안 된 것

- [ ] `/contact/` 페이지 부활 여부
- [ ] Ask 히스토리 캡션 — 지난 라운드에서 제가 임의로 넣은 문구("친구에게 질문 보내고 답 받기") 확정 필요
- [ ] waaait/comecame 로고·스크린샷·소개문구 (저녁 전달 예정이라고 하셨던 것 관련)
- [ ] Google Search Console에서 옛 URL(`/post/`, `/diary/` 등) 제거 요청 — 이건 콘솔 작업이라 Min님이 직접 해주셔야 해요

## 배포 시 주의

- GitHub Pages에 이 트리로 **통째로 교체** 배포하면 됨 (`.git` 폴더는 원래 repo 쪽에 이미 있으니 이 zip엔 안 넣었어요)
- 로컬에서 `index.html` 직접 열면 `fetch`가 막혀서 카드가 안 보여요 — 로컬 서버나 실제 배포 환경에서 확인해주세요

---

## v81 — Editorial list redesign

- Replaced the card-grid layout with an editorial list (bold Archivo Black headings, thin dividers between rows), closer to project7.app's reference style
- Whole site copy switched to English (hero, descriptions, categories, dates, buttons)
- Added a black intro box (name + tagline) right under the "Selected work" heading
- Added a Newest / A–Z sort control above the project list
- Each row now shows: title, live badge, one-line description, release date, and a bordered category tag on the same line
- Clicking a row opens a single detail modal (logo, name, category/date, store buttons if any, visit link, longer description, screenshot, and — for waaait — the NTS Drive history gallery)
- Removed the separate "read more" toggle and the standalone history modal; both are folded into this one detail modal
- Added `releaseDate` / `releaseDateLabel` and `logo` fields to `data/projects.json`
- New square logo assets: `assets/projects/waaait-logo.png`, `assets/projects/comecame-logo.png`
- Fonts switched to Archivo Black (headings) + Inter (body); dropped Space Grotesk and Newsreader

---

## v83 — Status filter + real Film demo

- Sort control moved into a rectangular dropdown, pinned to the right
- Added a rectangular All / Live / Demo status toggle on the left
- Added a `status` field to each project (`live` or `demo`) for filtering
- Revived the old NTS Drive Film feature as a real standalone page at `/film/`:
  - Actual camera capture (getUserMedia), the same 1-12 hour randomized "developing" delay and warm film filter as before
  - Old GNB/bottom-nav removed (those pages no longer exist) in favor of a single back-to-portfolio link
  - The separate `/album/` route was folded into an inline "My photos" section on the same page (locked cards while developing, lightbox + download once ready)
  - Photos are stored in this browser only (`camera_album_v1` in localStorage), same 2-week / 24-photo / 2MB budget as before
  - Listed on the homepage as a `demo`-status project so it only shows under All / Demo, not Live
