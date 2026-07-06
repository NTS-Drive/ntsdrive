/* ===== Time slots (no overlap, 24h covered) ===== */
const SLOTS = [
  { id: 'commute',   label: '출근길 생존 유의사항',      emoji: '🚇' },
  { id: 'morning',   label: '오전 업무 예언',            emoji: '☕' },
  { id: 'lunch',     label: '점심 식사 운세',            emoji: '🍚' },
  { id: 'afternoon', label: '오후 생존 가이드',          emoji: '📊' },
  { id: 'leaving',   label: '안전한 퇴근 셔틀 탑승 가이드', emoji: '🏃' },
  { id: 'home',      label: '집 도착 후 회복 운세',       emoji: '🏠' }
];

function getCurrentSlotId() {
  const mins = new Date().getHours() * 60 + new Date().getMinutes();
  if (mins >= 8 * 60 && mins < 9 * 60) return 'commute';
  if (mins >= 9 * 60 && mins < 11 * 60) return 'morning';
  if (mins >= 11 * 60 && mins < 12 * 60) return 'lunch';
  if (mins >= 12 * 60 && mins < 17 * 60) return 'afternoon';
  if (mins >= 17 * 60 && mins < 19 * 60) return 'leaving';
  return 'home'; // 19:00–23:59 and 00:00–7:59
}

/* ===== Content pools: 10 fortunes / 10 weapons / 10 tips per slot ===== */
const CONTENT = {
  commute: {
    fortunes: [
      '오늘 지하철은 당신의 인내심을 시험합니다. 문이 닫히기 직전 뛰는 순간, 우주의 기운이 당신 편이 아닐 수도 있습니다.',
      '오늘 엘리베이터는 당신보다 먼저 만석이 됩니다. 계단이 당신의 심폐지구력을 응원합니다.',
      '버스 정류장에 도착하는 순간 버스 뒷모습만 보게 될 확률이 높습니다.',
      '오늘 우산을 안 챙기면 하늘이 시험에 들게 할 것입니다.',
      '신호등이 유독 당신 앞에서만 빨간불로 바뀌는 하루입니다.',
      '오늘 아침, 이어폰 배터리가 딱 회사 도착 5분 전에 끊길 조짐입니다.',
      '엘리베이터 안에서 상사와 단둘이 마주칠 확률이 상승합니다.',
      '오늘은 카드 잔액이 딱 교통비만큼만 남아있을 수 있습니다.',
      '사원증을 두고 나왔을 확률이 평소보다 높은 아침입니다.',
      '오늘 지각은 아니지만, 지각처럼 보일 타이밍에 도착할 것입니다.'
    ],
    weapons: [
      '텀블러를 든 척하는 단단한 팔꿈치', '편한 운동화', '이어폰 볼륨을 최대로 높이는 용기',
      '사원증 목걸이의 무심한 손짓', '지각이 아니라는 확신에 찬 표정', '접이식 우산',
      '미리 충전해둔 보조배터리', '자연스럽게 눈을 피하는 기술', '커피 한 잔의 여유', '계단을 오르는 단단한 종아리'
    ],
    tips: [
      '"이번 역에서 내립니다." (사실 안 내림)', '문 닫히기 직전엔 무리하지 않기', '엘리베이터 대신 계단, 마음의 준비',
      '사원증은 미리 한 번 더 확인하기', '이어폰 배터리는 전날 밤 충전해두기', '상사와 마주치면 가볍게 목례만',
      '지각 직전엔 뛰지 말고 걷는 척하기', '우산은 그냥 챙기는 게 낫다', '교통카드 잔액은 미리 확인', '오늘은 정시 도착에 큰 의미 두지 않기'
    ]
  },
  morning: {
    fortunes: [
      '오전 중 큰 고비가 찾아오겠으나, 오후 4시 이후부터 우주의 기운이 퇴근을 향해 정렬됩니다.',
      '상사의 호출 확률이 상승합니다. 눈을 마주치지 않는 것이 오늘의 전략입니다.',
      '오늘 오전, 메신저 알림이 유독 많이 울릴 조짐입니다.',
      '회의 초대장이 예고 없이 날아올 수 있는 시간대입니다.',
      '오늘 오전 커피는 각성보다 위안에 가까운 효과를 낼 것입니다.',
      '이메일 답장을 기다리는 마음이 오전 내내 이어질 수 있습니다.',
      '오늘은 존재감을 최소화하는 것이 최고의 전략입니다.',
      '갑자기 생각난 할 일이 오전 계획을 흔들 수 있습니다.',
      '오늘 오전, 프린터가 당신을 시험할 조짐이 보입니다.',
      '집중이 잘 되다가도 갑자기 끊기는 타이밍이 찾아올 것입니다.'
    ],
    weapons: [
      '듀얼 모니터 한구석을 완벽히 가려주는 엑셀 창', '바쁘게 타이핑하는 척하는 키보드 소리', '미간을 찌푸리며 화면을 보는 진지한 표정',
      '헤드셋을 낀 채 딴생각하는 능력', '메모장에 적어두는 척하는 손놀림', '회의실行 직전 화장실 들르기',
      '커피 리필이라는 완벽한 핑계', '노트에 끄적이는 의미심장한 낙서', '"확인 중입니다"라는 만능 답변', '모니터 밝기를 낮춰 눈만 피곤한 척하기'
    ],
    tips: [
      '상사의 호출 확률이 상승합니다. 눈을 마주치지 않는 것이 전략입니다.', '"좋은 의견입니다."', '급한 일부터 처리하는 척, 사실은 쉬운 일부터',
      '메신저 알림은 잠깐 무음으로', '회의 초대는 일단 수락하고 나중에 고민하기', '커피는 두 잔까지만',
      '존재감은 있는 듯 없는 듯', '프린터 앞에서는 여유 있게 기다리기', '갑자기 생긴 할 일은 메모부터', '집중 끊기면 잠깐 스트레칭'
    ]
  },
  lunch: {
    fortunes: [
      '오늘 김치찌개와 제육볶음 사이에서 당신의 선택 장애가 최고조에 이릅니다.',
      '팀장님의 "다 같이 먹죠."가 발동할 가능성이 있습니다.',
      '오늘 점심시간, 웨이팅이 유독 길게 느껴질 조짐입니다.',
      '메뉴를 정했지만 막상 가보니 브레이크타임일 수 있습니다.',
      '동료가 추천한 메뉴가 의외로 취향 저격일 수 있습니다.',
      '오늘은 혼밥이 주는 평화가 유독 소중하게 느껴질 것입니다.',
      '점심시간이 유독 짧게 느껴지는 하루입니다.',
      '디저트 하나가 오후 컨디션을 좌우할 수 있습니다.',
      '오늘은 새로운 메뉴에 도전했다가 후회할 확률도 있습니다.',
      '점심값이 예상보다 조금 더 나올 수 있는 날입니다.'
    ],
    weapons: [
      '남이 먼저 고른 메뉴', '이미 정해둔 확고한 메뉴 취향', '먼저 도착해 자리를 맡는 순발력',
      '배달앱 즐겨찾기 목록', '동료의 추천을 믿는 용기', '디저트로 하루를 리셋하는 마음',
      '든든한 공깃밥 추가', '포인트 적립을 잊지 않는 꼼꼼함', '혼밥을 즐기는 여유', '점심시간을 알차게 쓰는 계획성'
    ],
    tips: [
      '이미 약속 있다고 자연스럽게 말하기', '메뉴 고민은 줄 서면서 하기', '브레이크타임은 미리 검색해보기',
      '디저트는 적당히', '혼밥할 땐 눈치 보지 않기', '점심시간엔 업무 얘기 최소화',
      '새로운 메뉴는 동료와 나눠 도전', '웨이팅 길면 대안 메뉴 준비', '점심값은 미리 예산 잡아두기', '남은 시간은 잠깐 산책으로'
    ]
  },
  afternoon: {
    fortunes: [
      '식곤증의 마왕이 접근합니다. 눈꺼풀이 무거워질수록 커피의 효율은 감소합니다.',
      '갑작스러운 회의 초대가 감지됩니다. 발표 자료는 없지만 발표는 당신 차례일 수 있습니다.',
      '오후 3시, 집중력이 바닥을 찍을 조짐입니다.',
      '메신저로 온 한 마디가 오후 내내 신경 쓰일 수 있습니다.',
      '갑자기 떨어진 업무가 오늘의 야근 후보 1순위입니다.',
      '오늘 오후, 커피보다 산책이 더 큰 효과를 낼 것입니다.',
      '프린터 앞 줄이 유독 길게 느껴지는 시간대입니다.',
      '오후 회의는 예상보다 길어질 조짐이 보입니다.',
      '갑작스러운 질문에 침착하게 답할 기운이 필요한 시간입니다.',
      '하루 중 가장 버티기 힘든 고비가 이 시간대에 찾아옵니다.'
    ],
    weapons: [
      '화장실까지의 산책', '"좋은 의견입니다."', '당분 보충용 초콜릿 한 조각',
      '스트레칭으로 위장한 기지개', '커피 대신 마시는 시원한 물 한 잔', '메모지에 적어두는 척하는 성실함',
      '회의실 구석 자리 선점', '발표 없이 넘어가길 바라는 간절함', '창밖을 잠깐 바라보는 여유', '다음 할 일 목록으로 도피하기'
    ],
    tips: [
      '식곤증엔 커피보다 산책', '갑작스러운 회의엔 일단 끄덕이기', '발표 순서가 오면 침착하게 아는 만큼만',
      '오후 3시엔 잠깐 자리 비우기', '신경 쓰이는 메시지는 나중에 답하기', '야근 후보 업무는 미리 표시해두기',
      '프린터는 여유 있게 기다리기', '회의 길어지면 마음 편히 내려놓기', '침착하게, 아는 척은 적당히', '버티는 것도 오늘의 성과입니다'
    ]
  },
  leaving: {
    fortunes: [
      '오늘의 퇴근 성공 확률은 87%입니다. 단, "잠깐 이야기 좀 하죠."라는 말을 들으면 확률이 초기화됩니다.',
      '퇴근 3분 전, 메신저 알림이 울릴 수 있습니다.',
      '엘리베이터 앞에서 상사와 마주칠 확률이 상승하는 시간대입니다.',
      '오늘은 칼퇴가 유독 짜릿하게 느껴질 조짐입니다.',
      '퇴근길 버스가 딱 맞춰 도착할 행운이 보입니다.',
      '"저 먼저 가보겠습니다"를 말할 용기가 필요한 순간입니다.',
      '오늘은 야근각이 슬쩍 스쳐 지나갈 수 있습니다.',
      '퇴근 후 약속이 있다면 오늘은 지켜질 확률이 높습니다.',
      '사무실 불을 끄는 순간의 해방감이 유독 클 것입니다.',
      '퇴근길, 오늘 하루를 돌아볼 여유가 생길 것입니다.'
    ],
    weapons: [
      '이미 가방을 챙겨둔 상태', '읽지 않은 척하기', '미리 저장해둔 완벽한 퇴근 인사말',
      '자연스러운 걸음걸이', '눈치껏 고른 퇴근 타이밍', '사원증을 이미 찍어둔 여유',
      '이어폰을 챙기는 손놀림', '엘리베이터 버튼을 먼저 누르는 순발력', '가벼운 발걸음', '내일을 위한 마음의 정리'
    ],
    tips: [
      '"잠깐 이야기 좀 하죠"는 못 들은 척', '가방은 미리 챙겨두기', '메신저는 집에 가서 확인하기',
      '상사와 마주치면 가볍게 인사만', '퇴근 인사는 자연스럽게', '엘리베이터는 서두르지 않기',
      '버스 시간은 미리 확인', '야근각이 보이면 조용히 자리 정리', '약속은 여유 있게 잡기', '오늘 하루도 수고했다고 스스로에게 말해주기'
    ]
  },
  home: {
    fortunes: [
      '오늘 하루를 살아남았습니다. 이것만으로도 당신은 MVP입니다.',
      '침대의 인력이 그 어느 때보다 강하게 느껴지는 밤입니다.',
      '오늘 하루의 피로가 씻겨 내려가는 샤워 시간이 찾아옵니다.',
      '야식의 유혹이 유독 강하게 찾아올 수 있는 밤입니다.',
      '오늘의 넷플릭스 한 편이 내일의 힘이 될 것입니다.',
      '이불 속에서의 휴대폰 스크롤이 예상보다 길어질 조짐입니다.',
      '오늘 하루를 잘 버틴 스스로에게 작은 보상이 필요한 시간입니다.',
      '내일 아침이 조금 덜 힘들 것 같은 예감이 듭니다.',
      '오늘 밤, 일찍 잠드는 것도 나쁘지 않은 선택입니다.',
      '하루의 끝, 아무것도 안 해도 되는 자유가 찾아옵니다.'
    ],
    weapons: [
      '냉장고에서 가장 먼저 보이는 것', '포근한 잠옷', '미지근한 물 한 잔',
      '좋아하는 드라마 한 편', '따뜻한 이불', '반신욕의 여유',
      '아무 생각 없이 보는 휴대폰', '좋아하는 음악 플레이리스트', '내일을 위한 미리 정리해둔 옷', '하루를 마무리하는 짧은 일기'
    ],
    tips: [
      '야식은 적당히, 그러나 참지는 말기', '오늘 하루 고생한 스스로를 칭찬하기', '자기 전 휴대폰은 알람만 맞추고 내려놓기',
      '내일 입을 옷은 미리 챙겨두기', '오늘 있었던 좋은 일 하나만 떠올리기', '무리한 다짐은 내일로 미루기',
      '일찍 씻고 일찍 눕기', '걱정거리는 잠시 내려놓기', '하루의 끝은 나를 위한 시간으로', '내일도 잘 버틸 수 있을 거예요'
    ]
  }
};

/* ===== Day-of-week bonus line (appended at the end) ===== */
const DAY_LINES = [
  '내일을 위한 재충전의 날입니다. 오늘만큼은 여유롭게.',          // Sun (0)
  '월요병 기운이 유독 강하게 감지됩니다. 그래도 오늘만 버티면 됩니다.', // Mon (1)
  '화요일다운 잔잔한 하루입니다. 무난한 게 최고예요.',              // Tue (2)
  '고비를 넘긴 절반의 안도감이 느껴집니다. 벌써 수요일이에요.',      // Wed (3)
  '내일이 코앞이라는 사실만으로 기운이 상승합니다.',                // Thu (4)
  '불금의 기운이 우주 전체를 감싸고 있습니다. 조금만 더 힘내세요!', // Fri (5)
  '오늘은 운세보다 이불 속이 우선입니다. 푹 쉬세요.'               // Sat (6)
];

/* ===== Jobs: 10 jobs × 15 lines each ===== */
const JOBS = [
  { id: 'dev', label: '개발자', lines: [
    '오늘의 버그는 어제 잘 되던 코드에서 나타납니다.', '배포 직전 새로운 이슈가 발견될 조짐입니다.', '오늘 커밋 메시지는 평소보다 짧아질 것입니다.',
    '회의에서 "그거 되나요?"라는 질문을 받을 확률이 높습니다.', '오늘은 캐시 문제일 가능성을 가장 먼저 의심하세요.', '재부팅이 의외의 해결책이 될 수 있는 하루입니다.',
    '스택오버플로우가 오늘도 당신을 구원할 것입니다.', '오늘의 코드 리뷰는 예상보다 코멘트가 많을 수 있습니다.', '로컬에서는 잘 되던 것이 서버에서 말썽일 조짐입니다.',
    '오늘은 변수명 짓기에 유독 오래 걸릴 수 있습니다.', '커피와 함께라면 오늘의 디버깅도 무사히 끝날 것입니다.', '오늘 슬랙 알림이 유독 많이 울릴 예감입니다.',
    '새로운 라이브러리 업데이트가 오늘의 변수가 될 수 있습니다.', '오늘은 주석을 남기는 습관이 미래의 당신을 구할 것입니다.', '예상 소요시간의 2배를 예상하면 딱 맞는 하루입니다.'
  ]},
  { id: 'designer', label: '디자이너', lines: [
    '오늘 시안은 세 번째 수정에서 통과될 조짐입니다.', '"조금만 더 화려하게" 요청이 들어올 수 있는 하루입니다.', '폰트 선택에 유독 신중해지는 하루입니다.',
    '오늘의 영감은 예상치 못한 곳에서 찾아올 것입니다.', '클라이언트의 "그냥 느낌적인 느낌" 피드백에 대비하세요.', '오늘은 색감 하나로 하루 종일 고민할 수 있습니다.',
    '시안 파일 이름이 v2_진짜최종으로 늘어날 조짐입니다.', '오늘의 작업물이 의외로 칭찬받을 확률이 높습니다.', '레퍼런스 찾는 시간이 작업 시간보다 길어질 수 있습니다.',
    '오늘은 여백의 미가 유독 중요한 하루입니다.', '갑작스러운 디자인 변경 요청에 대비하세요.', '오늘 작업한 것 중 하나는 결국 폐기될 수 있습니다.',
    '픽셀 하나에 집착하게 되는 하루입니다.', '오늘의 컬러 팔레트가 하루의 기분을 좌우합니다.', '완성도보다 마감 시간이 우선인 하루가 될 수 있습니다.'
  ]},
  { id: 'sales', label: '영업직', lines: [
    '오늘 미팅은 생각보다 순조롭게 흘러갈 조짐입니다.', '예상치 못한 고객의 질문에 순발력이 필요한 하루입니다.', '오늘의 전화 한 통이 이번 달 실적을 좌우할 수 있습니다.',
    '"고민해보겠습니다"라는 답변에 대비하세요.', '오늘은 미소가 최고의 무기가 되는 날입니다.', '갑작스러운 미팅 일정 변경이 있을 수 있습니다.',
    '오늘의 명함 한 장이 좋은 인연으로 이어질 조짐입니다.', '협상 테이블에서 침묵이 무기가 되는 하루입니다.', '오늘은 거절도 부드럽게 받아들이는 여유가 필요합니다.',
    '예상보다 좋은 반응을 얻을 미팅이 하나 있습니다.', '오늘의 이동 거리가 유독 길게 느껴질 수 있습니다.', '고객과의 스몰토크가 계약의 열쇠가 될 수 있습니다.',
    '오늘은 숫자보다 관계가 먼저인 하루입니다.', '갑자기 걸려온 전화가 좋은 소식일 확률이 있습니다.', '오늘 하루, 끈기가 결실을 맺을 조짐입니다.'
  ]},
  { id: 'marketer', label: '마케터', lines: [
    '오늘 올린 콘텐츠의 반응이 예상과 다를 수 있습니다.', '갑작스러운 트렌드 변화에 빠르게 대응해야 할 하루입니다.', '오늘의 카피 한 줄이 유독 잘 나올 조짐입니다.',
    '데이터를 보다가 하루가 다 갈 수 있습니다.', '오늘은 A안보다 B안이 더 좋은 반응을 얻을 것입니다.', '갑자기 늘어난 요청사항에 대비하세요.',
    '오늘의 회의에서 아이디어가 샘솟을 조짐입니다.', '경쟁사 동향 체크가 오늘의 주요 업무가 될 수 있습니다.', '오늘은 숫자보다 직감이 맞아떨어지는 날입니다.',
    '예상보다 늦게 컨펌이 날 수 있는 하루입니다.', '오늘 올린 게시물의 좋아요 수가 신경 쓰일 것입니다.', '갑작스러운 이슈 대응이 필요할 수 있습니다.',
    '오늘은 짧고 임팩트 있는 문구가 통하는 날입니다.', '트렌드를 따라가다 지치는 순간이 올 수 있습니다.', '오늘의 캠페인 아이디어, 회의에서 살아남을 조짐입니다.'
  ]},
  { id: 'hr', label: '인사(HR)', lines: [
    '오늘 면접 일정이 예상보다 빡빡할 수 있습니다.', '갑작스러운 상담 요청이 들어올 조짐입니다.', '오늘은 중립을 지키는 것이 최고의 전략입니다.',
    '채용 공고 문구 하나에 유독 신중해지는 하루입니다.', '오늘의 조율이 생각보다 매끄럽게 진행될 것입니다.', '갑자기 늘어난 서류 작업에 대비하세요.',
    '오늘은 경청이 가장 중요한 업무 스킬이 되는 날입니다.', '예상치 못한 퇴사 소식이 들려올 수 있습니다.', '오늘의 온보딩 준비가 순조롭게 흘러갈 조짐입니다.',
    '갑작스러운 규정 문의에 답할 준비를 해두세요.', '오늘은 공정함이 유독 시험받는 하루입니다.', '면접자의 긴장이 고스란히 전해지는 하루입니다.',
    '오늘 하루, 비밀 유지가 최고의 미덕입니다.', '갑작스러운 조직 변경 소식에 대비하세요.', '오늘의 중재가 팀 분위기를 바꿀 수 있습니다.'
  ]},
  { id: 'finance', label: '재무/회계', lines: [
    '오늘 숫자 하나가 안 맞아 하루가 길어질 조짐입니다.', '마감일이 다가올수록 집중력이 상승하는 하루입니다.', '오늘은 엑셀 단축키가 유독 손에 잘 붙는 날입니다.',
    '갑작스러운 감사 요청에 대비하세요.', '오늘의 영수증 정리가 생각보다 오래 걸릴 수 있습니다.', '숫자가 딱 맞아떨어지는 순간의 쾌감이 찾아올 것입니다.',
    '오늘은 사소한 오차 하나에 예민해지는 하루입니다.', '갑작스러운 예산 문의가 들어올 조짐입니다.', '오늘의 보고서, 검토가 예상보다 길어질 수 있습니다.',
    '마감 전 컴퓨터가 말썽일 확률이 상승합니다.', '오늘은 꼼꼼함이 그 어느 때보다 빛나는 날입니다.', '갑자기 필요한 서류를 찾느라 시간을 쓸 수 있습니다.',
    '오늘의 정산이 무사히 마무리될 조짐입니다.', '숫자와 씨름하는 하루, 커피가 필수입니다.', '오늘은 실수 없이 넘어가는 것 자체가 성과입니다.'
  ]},
  { id: 'support', label: '고객상담', lines: [
    '오늘 유독 긴 문의 전화가 걸려올 조짐입니다.', '"담당자 바꿔주세요"를 들을 확률이 상승합니다.', '오늘은 목소리 톤 관리가 최고의 스킬이 되는 날입니다.',
    '갑작스러운 컴플레인에 침착하게 대응해야 할 하루입니다.', '오늘의 응대 하나가 고객을 팬으로 만들 수 있습니다.', '반복되는 질문에도 처음처럼 친절할 힘이 필요합니다.',
    '오늘은 심호흡 한 번이 큰 도움이 될 것입니다.', '갑자기 몰리는 문의량에 대비하세요.', '오늘의 감정 노동, 스스로를 다독여주세요.',
    '예상보다 고마움을 표하는 고객을 만날 수 있습니다.', '오늘은 매뉴얼대로가 정답이 아닐 수도 있습니다.', '갑작스러운 시스템 오류에 대비하세요.',
    '오늘 하루, 친절함이 그대로 돌아올 조짐입니다.', '힘든 통화 후엔 잠깐 숨 고르기를 잊지 마세요.', '오늘의 인내심이 내일의 여유가 될 것입니다.'
  ]},
  { id: 'field', label: '생산/현장직', lines: [
    '오늘 라인 점검에서 사소한 이슈가 발견될 조짐입니다.', '안전이 최우선인 하루, 서두르지 마세요.', '오늘은 손발이 척척 맞는 팀워크가 빛나는 날입니다.',
    '갑작스러운 일정 변경에 대비하세요.', '오늘의 컨디션 관리가 그 어느 때보다 중요합니다.', '예상보다 작업이 순조롭게 끝날 조짐입니다.',
    '오늘은 작은 실수 하나에도 꼼꼼히 체크하세요.', '갑작스러운 자재 문제가 생길 수 있습니다.', '오늘의 휴식 시간, 제대로 챙기세요.',
    '날씨가 오늘 하루의 컨디션에 영향을 줄 수 있습니다.', '오늘은 안전장비 점검을 한 번 더 하는 게 좋겠습니다.', '갑자기 늘어난 물량에 대비하세요.',
    '오늘 하루, 동료와의 호흡이 중요한 열쇠입니다.', '예상치 못한 점검이 있을 수 있는 하루입니다.', '오늘의 노력이 결과물로 확실히 남을 것입니다.'
  ]},
  { id: 'freelancer', label: '프리랜서', lines: [
    '오늘 클라이언트의 답장이 늦어질 조짐입니다.', '갑작스러운 수정 요청에 대비하세요.', '오늘은 스스로 마감을 지키는 의지가 중요한 날입니다.',
    '예상보다 입금이 늦어질 수 있는 하루입니다.', '오늘의 집중력이 곧 오늘의 수입이 되는 하루입니다.', '갑자기 들어온 의뢰가 좋은 기회일 수 있습니다.',
    '오늘은 혼자 일하는 자유로움이 유독 크게 느껴질 것입니다.', '갑작스러운 계약 조건 변경에 대비하세요.', '오늘의 포트폴리오 정리가 다음 일로 이어질 조짐입니다.',
    '예상치 못한 협업 제안이 들어올 수 있습니다.', '오늘은 스스로에게 휴식을 허락해도 좋은 날입니다.', '갑자기 몰리는 마감이 하루를 바쁘게 만들 수 있습니다.',
    '오늘의 견적서, 조금 더 자신감을 가져도 좋습니다.', '혼자 있는 시간이 창의력의 원천이 되는 하루입니다.', '오늘 하루, 일과 삶의 균형을 챙겨보세요.'
  ]},
  { id: 'civil', label: '공무원', lines: [
    '오늘 민원 하나가 유독 까다로울 조짐입니다.', '갑작스러운 서류 요청에 대비하세요.', '오늘은 절차대로가 가장 안전한 길입니다.',
    '예상보다 회의가 길어질 수 있는 하루입니다.', '오늘의 결재가 예상보다 순조롭게 진행될 조짐입니다.', '갑자기 바뀐 지침에 당황할 수 있습니다.',
    '오늘은 꼼꼼한 확인이 그 어느 때보다 중요합니다.', '민원인의 감사 인사를 받을 확률이 있는 하루입니다.', '오늘의 공문 하나에 유독 신중해지는 하루입니다.',
    '갑작스러운 감사 준비가 필요할 수 있습니다.', '오늘은 원칙과 융통성 사이에서 균형이 필요합니다.', '예상치 못한 방문객이 있을 수 있는 하루입니다.',
    '오늘 하루, 안정감이 최고의 자산입니다.', '갑자기 늘어난 업무량에 대비하세요.', '오늘의 정시 퇴근, 은근히 기대해도 좋습니다.'
  ]}
];

/* ===== Lunch menu pool (100) ===== */
const MENUS = [
  '김치찌개','된장찌개','부대찌개','순두부찌개','제육볶음','돈까스','냉면','비빔밥','김밥','떡볶이',
  '칼국수','우동','짜장면','짬뽕','탕수육','마라탕','마라샹궈','훠궈','초밥','회덮밥',
  '국밥','콩나물국밥','순대국밥','삼겹살','갈비탕','설렁탕','곰탕','육개장','닭갈비','닭볶음탕',
  '파스타','리조또','피자','햄버거','샌드위치','샐러드','스테이크','스시','돈부리','규동',
  '카레','함박스테이크','오므라이스','볶음밥','짜장밥','쌀국수','분짜','반미','팟타이','나시고랭',
  '초계국수','열무국수','잔치국수','비빔냉면','물냉면','쟁반짜장','마파두부','양장피','깐풍기','라조기',
  '곱창전골','막창','곱창구이','감자탕','뼈해장국','순댓국','아구찜','코다리조림','갈치조림','고등어조림',
  '김치볶음밥','스팸김치찌개','부대볶음','치즈돈까스','카레돈까스','함박돈까스','냉모밀','온모밀','우삼겹덮밥','제육덮밥',
  '연어덮밥','참치덮밥','가츠카레','오야코동','규카츠','함박스테이크덮밥','로제떡볶이','즉석떡볶이','라볶이','쭈꾸미볶음',
  '낙지볶음','오징어볶음','콩국수','열무비빔밥','산채비빔밥','잡곡밥정식','백반','한정식','도시락','편의점 삼각김밥'
];

/* ===== Reopen (already-viewed) messages per slot ===== */
const REOPEN_MESSAGES = {
  commute: '출근길 운세는 이미 지하철에 두고 내렸습니다. 내일 다시 확인해주세요.',
  morning: '🔒 우주의 서버가 아직 다음 운세를 준비 중입니다. 미래를 너무 자주 보면 스포일러가 됩니다. 포춘쿠키를 두 번 부수면 그냥 과자가 됩니다.',
  lunch: '점심 운세는 소화 중입니다. 내일 다시 찾아와 주세요.',
  afternoon: '운세가 회의 중입니다. 안건이 끝나면 내일 다시 오겠습니다.',
  leaving: '퇴근 운세는 이미 퇴근했습니다.',
  home: '오늘의 운세는 취침에 들어갔습니다. 내일 다시 출근과 함께 시작됩니다.'
};

const DRAW_KEY = 'deskfortune_draws';
const JOB_KEY = 'deskfortune_job';

/* ===== Utilities ===== */
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function pick(arr) { return Math.floor(Math.random() * arr.length); }
function loadDraws() { try { return JSON.parse(localStorage.getItem(DRAW_KEY) || '{}'); } catch (e) { return {}; } }
function saveDraws(d) { localStorage.setItem(DRAW_KEY, JSON.stringify(d)); }
function getSlot(id) { return SLOTS.find(s => s.id === id); }
function getJob(id) { return JOBS.find(j => j.id === id); }
function loadSelectedJob() { return localStorage.getItem(JOB_KEY) || null; }
function saveSelectedJob(id) { localStorage.setItem(JOB_KEY, id); }

/* ===== Draw logic ===== */
function drawForSlot(slotId, jobId) {
  const pool = CONTENT[slotId];
  const draw = {
    date: todayStr(),
    slot: slotId,
    fortuneIdx: pick(pool.fortunes),
    weaponIdx: pick(pool.weapons),
    tipIdx: pick(pool.tips),
    day: new Date().getDay(),
    job: jobId,
    jobLineIdx: pick(getJob(jobId).lines),
    menuIdx: slotId === 'lunch' ? pick(MENUS) : null
  };
  const draws = loadDraws();
  draws[slotId] = draw;
  saveDraws(draws);
  return draw;
}

function getTodayDraw(slotId) {
  const draws = loadDraws();
  const d = draws[slotId];
  if (d && d.date === todayStr()) return d;
  return null;
}

/* ===== Rendering ===== */
const stage = document.getElementById('stage');
let selectedJob = loadSelectedJob();

function render() {
  const slotId = getCurrentSlotId();
  const slot = getSlot(slotId);
  const existing = getTodayDraw(slotId);

  if (existing) {
    renderResult(slot, existing, false);
  } else {
    renderCookieStage(slot);
  }
}

function renderCookieStage(slot) {
  const jobChips = JOBS.map(j => `
    <button class="job-chip ${selectedJob === j.id ? 'selected' : ''}" onclick="selectJob('${j.id}')">${j.label}</button>
  `).join('');

  stage.innerHTML = `
    <div class="hero">
      <div class="hero-emoji">🥠</div>
      <div class="hero-title">오늘도 무사퇴근</div>
      <div class="hero-sub">지금 시각에 맞는 포춘쿠키가 준비됐어요</div>
      <div class="slot-badge">${slot.emoji} ${slot.label}</div>
    </div>

    <div class="job-section">
      <div class="job-title">지금 당신의 직업은?</div>
      <div class="job-grid">${jobChips}</div>
    </div>

    <div class="cookie-stage">
      <button class="cookie-btn" id="cookieBtn" onclick="handleCrack()" ${selectedJob ? '' : 'disabled'}>🥠</button>
      <div class="cookie-hint" id="cookieHint">${selectedJob ? '쿠키를 눌러 오늘의 운세를 확인하세요' : '직업을 먼저 선택해주세요'}</div>
    </div>
  `;
}

function selectJob(jobId) {
  selectedJob = jobId;
  saveSelectedJob(jobId);
  const slot = getSlot(getCurrentSlotId());
  renderCookieStage(slot);
}

function handleCrack() {
  if (!selectedJob) return;
  const slotId = getCurrentSlotId();
  const draw = drawForSlot(slotId, selectedJob);
  renderResult(getSlot(slotId), draw, true);
}

function renderResult(slot, draw, isFresh) {
  const pool = CONTENT[slot.id];
  const fortune = pool.fortunes[draw.fortuneIdx];
  const weapon = pool.weapons[draw.weaponIdx];
  const tip = pool.tips[draw.tipIdx];
  const dayLine = DAY_LINES[draw.day];
  const job = getJob(draw.job);
  const jobLine = job ? job.lines[draw.jobLineIdx] : '';
  const menuHtml = (slot.id === 'lunch' && draw.menuIdx != null) ? `
    <div class="menu-card">
      <div class="menu-label">🍱 오늘의 추천 메뉴</div>
      <div class="menu-name">${MENUS[draw.menuIdx]}</div>
    </div>
  ` : '';

  stage.innerHTML = `
    <div class="hero">
      <div class="slot-badge">${slot.emoji} ${slot.label}</div>
    </div>
    ${isFresh ? '' : `<div class="locked-note">${REOPEN_MESSAGES[slot.id]}</div>`}
    <div class="result-card">
      <div class="result-fortune">${fortune}</div>
      <div class="result-row"><span class="row-label">🔮 행운의 무기</span><span>${weapon}</span></div>
      <div class="result-row"><span class="row-label">🧿 오늘의 팁</span><span>${tip}</span></div>
      <div class="result-day-line">${dayLine}</div>
      ${job ? `<div class="result-job-line">👤 ${job.label} 코멘트: ${jobLine}</div>` : ''}
    </div>
    ${menuHtml}
    <div class="share-row">
      <button class="action-btn primary" onclick="shareLink()">🔗 링크 공유</button>
      <button class="action-btn" onclick="saveImage()">📸 이미지로 저장</button>
    </div>
    <div class="footer-note">이 시간대는 내일 다시 확인할 수 있어요.</div>
  `;
}

/* ===== Share ===== */
function buildShareUrl() {
  const draws = loadDraws();
  const d = draws[getCurrentSlotId()];
  const url = new URL(window.location.href.split('?')[0]);
  if (d) {
    url.searchParams.set('slot', d.slot);
    url.searchParams.set('f', d.fortuneIdx);
    url.searchParams.set('w', d.weaponIdx);
    url.searchParams.set('t', d.tipIdx);
    url.searchParams.set('day', d.day);
    url.searchParams.set('job', d.job);
    url.searchParams.set('jl', d.jobLineIdx);
    if (d.menuIdx != null) url.searchParams.set('m', d.menuIdx);
  }
  return url.toString();
}

function shareLink() {
  const url = buildShareUrl();
  if (navigator.share) {
    navigator.share({ title: '오늘도 무사퇴근', text: '오늘의 포춘쿠키 결과예요!', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => toast('링크가 복사됐어요!')).catch(() => toast('복사에 실패했어요.'));
  }
}

function saveImage() {
  html2canvas(document.getElementById('capture-area')).then(c => {
    const link = document.createElement('a');
    link.download = `오늘의포춘_${Date.now()}.png`;
    link.href = c.toDataURL();
    link.click();
    toast('이미지가 저장됐어요.');
  });
}

function renderSharedIfPresent() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('slot')) return false;

  const slot = getSlot(params.get('slot'));
  if (!slot) return false;
  const pool = CONTENT[slot.id];
  const fortuneIdx = parseInt(params.get('f'), 10);
  const weaponIdx = parseInt(params.get('w'), 10);
  const tipIdx = parseInt(params.get('t'), 10);
  const day = parseInt(params.get('day'), 10);
  const jobId = params.get('job');
  const jobLineIdx = parseInt(params.get('jl'), 10);
  const menuIdx = params.has('m') ? parseInt(params.get('m'), 10) : null;

  const job = getJob(jobId);
  const menuHtml = (slot.id === 'lunch' && menuIdx != null) ? `
    <div class="menu-card">
      <div class="menu-label">🍱 오늘의 추천 메뉴</div>
      <div class="menu-name">${MENUS[menuIdx]}</div>
    </div>` : '';

  stage.innerHTML = `
    <div class="hero">
      <div class="hero-emoji">🥠</div>
      <div class="slot-badge">${slot.emoji} ${slot.label}</div>
    </div>
    <div class="locked-note">누군가 나눠준 오늘의 포춘쿠키 결과예요 🥠</div>
    <div class="result-card">
      <div class="result-fortune">${pool.fortunes[fortuneIdx]}</div>
      <div class="result-row"><span class="row-label">🔮 행운의 무기</span><span>${pool.weapons[weaponIdx]}</span></div>
      <div class="result-row"><span class="row-label">🧿 오늘의 팁</span><span>${pool.tips[tipIdx]}</span></div>
      <div class="result-day-line">${DAY_LINES[day]}</div>
      ${job ? `<div class="result-job-line">👤 ${job.label} 코멘트: ${job.lines[jobLineIdx]}</div>` : ''}
    </div>
    ${menuHtml}
    <div class="share-row">
      <button class="action-btn primary" onclick="location.href='index.html'">나도 뽑아보기</button>
    </div>
  `;
  return true;
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

/* ===== Boot ===== */
if (!renderSharedIfPresent()) {
  render();
}
