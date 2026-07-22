# NTS Drive · 검색엔진(구글/네이버) 노출 세팅 가이드

이번에 코드로 미리 준비해둔 것과, 반드시 본인 계정으로 직접 해야 하는 것을 나눠서 정리했어.

---

## ✅ 코드로 이미 반영한 것

- `robots.txt` — 전체 크롤링 허용 + sitemap 위치 명시
- `sitemap.xml` — 핵심 콘텐츠 페이지 13개 등록 (홈, Post/Log/Diary/Snap/Film, 미니게임 4개, 약관/개인정보/문의)
- 각 페이지에 `<title>`, `<meta name="description">`, `<link rel="canonical">` 추가 (기존엔 홈페이지조차 description이 없었음 — 검색결과 스니펫에 아무 설명도 안 뜨는 상태였음)
- 홈페이지에 JSON-LD(WebSite 구조화 데이터) 추가
- Google/Naver 소유 확인 메타태그 자리를 `index.html` `<head>`에 주석으로 미리 만들어둠

---

## 🔲 본인이 직접 해야 하는 것

### 1. Google Search Console
1. https://search.google.com/search-console 접속 → Google 계정으로 로그인
2. "URL 접두어" 방식으로 `https://ntsdrive.com/` 등록
3. 소유 확인 방법 중 **"HTML 태그"** 선택 → 발급되는 `<meta name="google-site-verification" content="...">` 코드 복사
4. `index.html`의 아래 주석 처리된 부분 찾아서 주석 풀고 코드 넣기:
   ```html
   <meta name="google-site-verification" content="여기에 발급받은 코드">
   ```
5. Search Console로 돌아가 "확인" 클릭
6. 확인되면 좌측 메뉴 **Sitemaps**에서 `sitemap.xml` 제출
7. **URL 검사** 도구로 홈페이지 URL 넣고 "색인 생성 요청" 클릭 (색인이 더 빨리 시작됨)

### 2. 네이버 서치어드바이저
1. https://searchadvisor.naver.com 접속 → 네이버 계정으로 로그인
2. "사이트 등록"에서 `https://ntsdrive.com/` 입력
3. 소유 확인 방법 중 **"HTML 태그"** 선택 → `<meta name="naver-site-verification" content="...">` 코드 복사
4. 마찬가지로 `index.html`의 주석 풀고 코드 삽입
5. 확인 후 **요청 > 사이트맵 제출**에서 `sitemap.xml` 제출
6. **요청 > 웹페이지 수집** 에서 홈페이지 URL 수집 요청

### 3. 두 코드를 한 번에 반영하는 법
Google, 네이버 코드 둘 다 발급받으면 아래처럼 주석 풀고 두 줄 다 넣으면 돼:
```html
<meta name="google-site-verification" content="구글에서_받은_코드">
<meta name="naver-site-verification" content="네이버에서_받은_코드">
```
수정 후 GitHub Desktop으로 커밋/푸시하면 바로 반영돼.

---

## 참고
- 색인은 등록한다고 바로 되는 게 아니라 **보통 며칠~2주** 정도 걸려. AdSense 신청은 색인 완료를 기다리지 않고 바로 진행해도 무방해 (별개 프로세스).
- Search Console에 쌓이는 데이터(클릭수, 노출수, 검색어)는 나중에 어떤 기능이 사람들을 끌어오는지 파악하는 데도 유용하니 AdSense와 별개로 계속 확인하는 걸 추천해.
