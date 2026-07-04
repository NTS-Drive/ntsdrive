# 오피스 아케이드 (가칭) — 정적 미니게임 허브

백엔드 없이 정적 파일만으로 동작하는 미니게임 목록 플랫폼입니다.

## 구조

```
office-game-hub/
├── index.html        게임 목록 페이지 (games.json을 읽어 렌더링)
├── styles.css         목록 페이지 스타일
├── games.json          게임 메타데이터 (게임 추가 시 이 파일만 수정)
└── games/
    └── doc-stack-clicker/   게임 1호: 무한 결재 올리기
        ├── index.html
        ├── style.css
        └── script.js
```

## 새 게임 추가하는 법

1. `games/` 밑에 새 폴더 생성 (예: `games/slack-triage/`)
2. 그 안에 게임용 `index.html` / `style.css` / `script.js` 작성
3. `games.json`에 아래 형식으로 한 줄 추가

```json
{
  "id": "slack-triage",
  "title": "채널 정리의 신",
  "concept": "한 줄 설명",
  "homage": "사내 메신저 채널 목록",
  "status": "배포중",
  "entryPath": "games/slack-triage/index.html",
  "registeredAt": "2026-07-05"
}
```

코드는 건드릴 필요 없이 `games.json`만 갱신하면 목록 페이지에 자동 반영됩니다.
(`entryPath`를 `null`로 두면 "준비중" 상태로만 표시됩니다.)

## 로컬 확인

`index.html`을 브라우저로 바로 열면 `fetch('games.json')`이 CORS 정책에 막혀
목록이 비어 보일 수 있습니다. 아래처럼 간이 서버로 띄워서 확인하세요.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```

## 배포 (택1, 모두 무료)

### Vercel
1. GitHub 저장소에 이 폴더를 push
2. vercel.com → New Project → 저장소 선택 → Framework Preset: "Other" → Deploy
3. 별도 빌드 설정 불필요 (정적 파일 그대로 서빙)

### Netlify
1. GitHub 저장소 연결 또는 이 폴더를 그대로 드래그 앤 드롭 (Netlify Drop)
2. Build command 비워두고 Publish directory를 프로젝트 루트로 지정

### GitHub Pages
1. 저장소 Settings → Pages → Source를 `main` 브랜치, 루트 디렉토리로 지정
2. `https://<계정>.github.io/<저장소명>/` 에서 확인

세 옵션 다 카드 등록이나 서버 관리 없이 0원으로 운영 가능합니다.

## 광고 슬롯

`index.html`의 `.ad-slot` div가 자리 표시자입니다. Google AdSense 승인 후
해당 위치에 스니펫을 삽입하면 됩니다. (승인 전 사이트에 실제 콘텐츠가
충분히 쌓여 있어야 심사 통과 확률이 올라갑니다 — 게임 3~5개 이상 확보 후
신청 권장)

## 홈 디자인 변경 이력 (2026-07-04, v2)

기존 "그룹웨어 결재함" 목록형에서 **파일 탐색기(폴더) 오마주**로 전면 교체.

- 주소창(브레드크럼) + 툴바(정렬/새로고침) + 좌측 사이드바(빠른 실행/상태 필터) +
  컬럼 리스트(이름/오마주 대상/등록일/상태/실행) + 하단 상태 표시줄 구조
- 검색창은 games.json의 title/concept/homage를 클라이언트에서 실시간 필터링
- 사이드바 "신규 등록"은 `registeredAt` 기준 14일 이내 게임 자동 표시
- 파일 아이콘은 실제 OS 폴더/파일 아이콘을 쓰지 않고, 게임 ID 해시 기반으로
  색이 정해지는 모노그램 사각 뱃지로 대체 (상표권 회피 + 카드형 확장 여지)
- 게임 상세 페이지(`games/doc-stack-clicker/`)의 "결재함" 스타일은 게임 자체의
  세계관이므로 유지, 홈 UI와는 분리된 톤으로 운영

## 상표권 관련 주의사항

- 게임 이름/컨셉은 오피스 소프트웨어를 연상시키되, 실제 로고·컬러 시스템·
  아이콘을 그대로 베끼지 않았습니다. `games.json`에 새 게임을 추가할 때도
  동일 기준을 유지하세요.
- 특정 회사명(MS, Slack, Figma, Google 등)을 게임 타이틀이나 UI 텍스트에
  직접 노출하지 않는 것을 원칙으로 합니다.
