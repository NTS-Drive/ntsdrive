/* ===== Data: 78 cards ===== */
const CARDS = [
  // Major Arcana (22)
  { name: 'The Fool', emoji: '🐣', keyword: '새로운 시작', energy: 'positive' },
  { name: 'The Magician', emoji: '🪄', keyword: '무한한 가능성', energy: 'positive' },
  { name: 'The High Priestess', emoji: '🌙', keyword: '직관과 비밀', energy: 'neutral' },
  { name: 'The Empress', emoji: '🌸', keyword: '풍요와 돌봄', energy: 'positive' },
  { name: 'The Emperor', emoji: '🏛️', keyword: '안정과 통제', energy: 'neutral' },
  { name: 'The Hierophant', emoji: '📜', keyword: '전통과 규칙', energy: 'neutral' },
  { name: 'The Lovers', emoji: '💞', keyword: '선택과 연결', energy: 'positive' },
  { name: 'The Chariot', emoji: '🏎️', keyword: '추진력과 승리', energy: 'positive' },
  { name: 'Strength', emoji: '🦁', keyword: '내면의 용기', energy: 'positive' },
  { name: 'The Hermit', emoji: '🕯️', keyword: '혼자만의 시간', energy: 'neutral' },
  { name: 'Wheel of Fortune', emoji: '🎡', keyword: '흐름의 전환', energy: 'neutral' },
  { name: 'Justice', emoji: '⚖️', keyword: '균형과 판단', energy: 'neutral' },
  { name: 'The Hanged Man', emoji: '🙃', keyword: '잠깐의 정지', energy: 'challenging' },
  { name: 'Death', emoji: '💀', keyword: '끝과 새로운 국면', energy: 'challenging' },
  { name: 'Temperance', emoji: '🧪', keyword: '조화와 절제', energy: 'positive' },
  { name: 'The Devil', emoji: '⛓️', keyword: '집착과 굴레', energy: 'challenging' },
  { name: 'The Tower', emoji: '🗼', keyword: '예상치 못한 변화', energy: 'challenging' },
  { name: 'The Star', emoji: '⭐', keyword: '희망과 회복', energy: 'positive' },
  { name: 'The Moon', emoji: '🌘', keyword: '불확실함과 혼란', energy: 'challenging' },
  { name: 'The Sun', emoji: '☀️', keyword: '밝은 성취', energy: 'positive' },
  { name: 'Judgement', emoji: '📯', keyword: '각성과 재정비', energy: 'positive' },
  { name: 'The World', emoji: '🌍', keyword: '완성과 마무리', energy: 'positive' },
  // Wands (14)
  { name: 'Ace of Wands', emoji: '🔥', keyword: '새로운 열정', energy: 'positive' },
  { name: 'Two of Wands', emoji: '🗺️', keyword: '계획과 확장', energy: 'neutral' },
  { name: 'Three of Wands', emoji: '⛵', keyword: '진행과 전망', energy: 'positive' },
  { name: 'Four of Wands', emoji: '🎉', keyword: '축하와 안정', energy: 'positive' },
  { name: 'Five of Wands', emoji: '🤼', keyword: '경쟁과 마찰', energy: 'challenging' },
  { name: 'Six of Wands', emoji: '🏆', keyword: '인정과 승리', energy: 'positive' },
  { name: 'Seven of Wands', emoji: '🛡️', keyword: '방어와 고수', energy: 'neutral' },
  { name: 'Eight of Wands', emoji: '🏹', keyword: '빠른 진행', energy: 'positive' },
  { name: 'Nine of Wands', emoji: '🩹', keyword: '지친 버팀', energy: 'challenging' },
  { name: 'Ten of Wands', emoji: '🎒', keyword: '과중한 부담', energy: 'challenging' },
  { name: 'Page of Wands', emoji: '📨', keyword: '호기심 가득한 소식', energy: 'neutral' },
  { name: 'Knight of Wands', emoji: '🐎', keyword: '저돌적 추진', energy: 'neutral' },
  { name: 'Queen of Wands', emoji: '👑', keyword: '자신감과 매력', energy: 'positive' },
  { name: 'King of Wands', emoji: '🎩', keyword: '리더십과 비전', energy: 'positive' },
  // Cups (14)
  { name: 'Ace of Cups', emoji: '💗', keyword: '새로운 감정', energy: 'positive' },
  { name: 'Two of Cups', emoji: '🤝', keyword: '파트너십', energy: 'positive' },
  { name: 'Three of Cups', emoji: '🥂', keyword: '함께하는 기쁨', energy: 'positive' },
  { name: 'Four of Cups', emoji: '🥱', keyword: '권태와 무관심', energy: 'neutral' },
  { name: 'Five of Cups', emoji: '😢', keyword: '아쉬움과 후회', energy: 'challenging' },
  { name: 'Six of Cups', emoji: '🧸', keyword: '추억과 향수', energy: 'neutral' },
  { name: 'Seven of Cups', emoji: '🌈', keyword: '선택지의 혼란', energy: 'neutral' },
  { name: 'Eight of Cups', emoji: '🚶', keyword: '떠남과 정리', energy: 'challenging' },
  { name: 'Nine of Cups', emoji: '😌', keyword: '소망의 충족', energy: 'positive' },
  { name: 'Ten of Cups', emoji: '🏡', keyword: '충만한 행복', energy: 'positive' },
  { name: 'Page of Cups', emoji: '💌', keyword: '다정한 소식', energy: 'positive' },
  { name: 'Knight of Cups', emoji: '🕊️', keyword: '낭만적 제안', energy: 'neutral' },
  { name: 'Queen of Cups', emoji: '🌊', keyword: '깊은 공감', energy: 'positive' },
  { name: 'King of Cups', emoji: '🧘', keyword: '감정의 균형', energy: 'neutral' },
  // Swords (14)
  { name: 'Ace of Swords', emoji: '⚔️', keyword: '명료한 통찰', energy: 'positive' },
  { name: 'Two of Swords', emoji: '🙈', keyword: '결정 보류', energy: 'neutral' },
  { name: 'Three of Swords', emoji: '💔', keyword: '상처와 슬픔', energy: 'challenging' },
  { name: 'Four of Swords', emoji: '😴', keyword: '휴식의 필요', energy: 'neutral' },
  { name: 'Five of Swords', emoji: '🥊', keyword: '소모적인 갈등', energy: 'challenging' },
  { name: 'Six of Swords', emoji: '🚤', keyword: '전환과 이동', energy: 'neutral' },
  { name: 'Seven of Swords', emoji: '🕵️', keyword: '전략과 요령', energy: 'neutral' },
  { name: 'Eight of Swords', emoji: '🪢', keyword: '스스로 갇힘', energy: 'challenging' },
  { name: 'Nine of Swords', emoji: '😰', keyword: '불안과 걱정', energy: 'challenging' },
  { name: 'Ten of Swords', emoji: '🌅', keyword: '바닥 찍고 회복', energy: 'challenging' },
  { name: 'Page of Swords', emoji: '🗞️', keyword: '예리한 정보', energy: 'neutral' },
  { name: 'Knight of Swords', emoji: '🌪️', keyword: '저돌적 돌진', energy: 'challenging' },
  { name: 'Queen of Swords', emoji: '🔍', keyword: '냉철한 판단', energy: 'neutral' },
  { name: 'King of Swords', emoji: '🧑\u200d⚖️', keyword: '논리와 권위', energy: 'neutral' },
  // Pentacles (14)
  { name: 'Ace of Pentacles', emoji: '🌱', keyword: '새로운 기회', energy: 'positive' },
  { name: 'Two of Pentacles', emoji: '🤹', keyword: '균형 잡힌 저글링', energy: 'neutral' },
  { name: 'Three of Pentacles', emoji: '🧰', keyword: '협업과 숙련', energy: 'positive' },
  { name: 'Four of Pentacles', emoji: '🔒', keyword: '안정과 집착', energy: 'neutral' },
  { name: 'Five of Pentacles', emoji: '🥶', keyword: '결핍과 불안', energy: 'challenging' },
  { name: 'Six of Pentacles', emoji: '🎁', keyword: '나눔과 지원', energy: 'positive' },
  { name: 'Seven of Pentacles', emoji: '⏳', keyword: '결실을 기다림', energy: 'neutral' },
  { name: 'Eight of Pentacles', emoji: '🔨', keyword: '성실한 숙달', energy: 'positive' },
  { name: 'Nine of Pentacles', emoji: '💎', keyword: '독립적 여유', energy: 'positive' },
  { name: 'Ten of Pentacles', emoji: '🏰', keyword: '안정된 기반', energy: 'positive' },
  { name: 'Page of Pentacles', emoji: '📚', keyword: '배움의 시작', energy: 'neutral' },
  { name: 'Knight of Pentacles', emoji: '🐢', keyword: '꾸준한 진행', energy: 'neutral' },
  { name: 'Queen of Pentacles', emoji: '🌾', keyword: '실속 있는 돌봄', energy: 'positive' },
  { name: 'King of Pentacles', emoji: '🏦', keyword: '현실적 성공', energy: 'positive' }
];

/* ===== Data: 10 categories × 3 energy tiers × 5 phrases ===== */
const CATEGORIES = [
  { id: 'commute', emoji: '☀️', label: '오늘의 출근길 운세', phrases: {
    positive: ['오늘은 지하철에서도 왠지 앉을 자리가 생길 것 같은 날이에요.', '출근길 발걸음이 유독 가볍게 느껴지는 아침이네요.', '오늘 하루, 생각보다 일이 술술 풀릴 기운이 보여요.', '커피 한 잔의 여유가 하루를 다르게 만들어줄 거예요.', '오늘따라 사무실 공기가 나쁘지 않을 것 같아요.'],
    neutral: ['평범한 하루가 될 것 같아요. 평범한 게 제일 편할 때도 있죠.', '특별한 일은 없지만, 무탈한 것도 나쁘지 않은 하루예요.', '오늘은 그냥 하던 대로만 하면 되는 날이에요.', '잔잔한 하루, 큰 굴곡 없이 지나갈 것 같아요.', '오늘은 관찰자 모드로 조용히 지내는 게 어울려요.'],
    challenging: ['오늘은 알림음이 유독 많이 울릴 것 같은 예감이에요.', '지하철이 조금 늦게 올 수도 있으니 마음의 준비를 해두세요.', '예상 밖의 일정이 하나쯤 끼어들 수 있는 하루예요.', '오늘은 커피를 한 잔 더 챙기는 게 좋을 것 같아요.', '평소보다 조금 더 정신을 바짝 차려야 할 하루예요.']
  }},
  { id: 'jobchange', emoji: '💼', label: '이달의 이직운', phrases: {
    positive: ['이번 달, 생각지도 못한 곳에서 좋은 제안이 들어올 수 있어요.', '지금 준비하고 있는 것들이 곧 빛을 볼 시기예요.', '이직 시장에서 나를 알아봐 주는 곳이 나타날 달이에요.', '이번 달의 면접운은 꽤 괜찮은 편이에요.', '조금만 더 두드리면 문이 열릴 것 같은 달이에요.'],
    neutral: ['이직은 지금 당장보다는 조금 더 지켜봐도 괜찮은 시기예요.', '이번 달은 정보를 모으고 준비하는 데 집중하기 좋아요.', '큰 변화보다는 현상 유지가 어울리는 달이에요.', '서두르지 않아도 되는, 관망의 달이에요.', '이력서를 다듬어두기만 해도 충분한 달이에요.'],
    challenging: ['이번 달은 성급한 이직 결정은 잠깐 미뤄두는 게 좋을 것 같아요.', '원하는 만큼 빠르게 진행되지 않을 수 있으니 여유를 가지세요.', '이직 시장이 조금 조용한 시기일 수 있어요.', '이번 달은 준비 기간이라 생각하고 마음을 편히 가지세요.', '예상보다 결과를 조금 더 기다려야 할 수도 있어요.']
  }},
  { id: 'boss', emoji: '😎', label: '상사와의 궁합', phrases: {
    positive: ['오늘은 상사와 의외로 합이 잘 맞는 날이에요.', '예상보다 반응이 좋을 수 있으니 보고를 미루지 마세요.', '오늘의 아이디어, 상사에게 좋은 인상을 남길 것 같아요.', '눈이 마주쳐도 어색하지 않은, 나쁘지 않은 케미의 날이에요.', '오늘은 작은 칭찬 한마디를 들을 수도 있어요.'],
    neutral: ['오늘은 그냥 무난하게, 각자 할 일만 하면 되는 날이에요.', '큰 마찰도 큰 애정도 없는 평범한 하루예요.', '오늘은 필요한 말만 딱 하고 넘어가는 게 좋아요.', '서로 적당한 거리를 유지하기 좋은 하루예요.', '특별한 신호는 없지만, 무탈한 것도 나쁘지 않아요.'],
    challenging: ['오늘은 보고 타이밍을 조금 신중히 잡는 게 좋겠어요.', '사소한 걸로 예민해질 수 있으니 한 박자 쉬고 말하세요.', '오늘은 정면 승부보다 우회가 나을 수 있어요.', '눈치껏 조용히 지나가는 것도 전략이에요.', '오늘은 그냥 리액션을 최소화하는 게 답일 수도 있어요.']
  }},
  { id: 'salary', emoji: '💰', label: '이번 달 연봉/보너스운', phrases: {
    positive: ['예상보다 좋은 소식이 통장에 찍힐 수도 있어요.', '그동안의 노력이 숫자로 인정받을 시기예요.', '이번 달은 보너스 관련 이야기가 나올 가능성이 있어요.', '협상 테이블에 앉는다면 생각보다 유리할 수 있어요.', '작은 보상이라도 기분 좋게 찾아올 달이에요.'],
    neutral: ['이번 달은 큰 변화 없이 평소와 비슷한 흐름이에요.', '숫자보다 안정이 더 중요한 달일 수 있어요.', '협상은 이번 달보다 다음 기회를 노리는 게 나을 수 있어요.', '지금은 조용히 실적을 쌓아두는 시기예요.', '큰 기대보다는 담담하게 지나가는 게 편한 달이에요.'],
    challenging: ['이번 달은 지갑 사정에 조금 여유를 두는 게 좋겠어요.', '이번 달은 큰 지출은 잠깐 미뤄두는 게 좋을 수도 있어요.', '숫자 이야기는 다음 기회에 다시 꺼내보는 게 나을 수 있어요.', '예상만큼 딱 떨어지지 않을 수 있으니 미리 마음의 여유를 가지세요.', '이번 달은 소비보다 저축 쪽에 조금 더 무게를 두면 좋겠어요.']
  }},
  { id: 'dinner', emoji: '🍻', label: '오늘 회식/야근운', phrases: {
    positive: ['오늘 회식자리, 의외로 재밌는 이야기가 오갈 것 같아요.', '야근을 하더라도 생각보다 수월하게 끝날 것 같은 하루예요.', '오늘은 회식에서 은근히 주목받을 운이에요.', '예상보다 일찍 자리가 마무리될 수 있어요.', '오늘 저녁, 나쁘지 않은 사람들과 좋은 대화를 나눌 것 같아요.'],
    neutral: ['오늘은 그냥 무난하게 자리를 지키면 되는 저녁이에요.', '특별한 이벤트 없이 조용히 지나갈 저녁이에요.', '적당히 먹고 적당히 웃으면 되는 하루예요.', '오늘은 있는 듯 없는 듯 지내는 것도 나쁘지 않아요.', '무리하지 않는 선에서 즐기면 딱 좋은 저녁이에요.'],
    challenging: ['오늘은 2차 제안을 정중히 거절해도 괜찮은 날이에요.', '예상보다 자리가 길어질 수 있으니 마음의 준비를 해두세요.', '오늘은 컨디션 관리에 조금 더 신경 쓰는 게 좋겠어요.', '야근이 생각보다 길어질 수 있는 하루예요.', '오늘은 일찍 빠져나갈 핑계 하나쯤 준비해두는 것도 좋아요.']
  }},
  { id: 'meeting', emoji: '📋', label: '오늘의 회의운', phrases: {
    positive: ['오늘 회의에서 낸 의견이 의외로 좋은 반응을 얻을 것 같아요.', '발언할 타이밍이 절묘하게 잘 맞아떨어지는 하루예요.', '오늘은 회의가 예상보다 빨리 끝날 조짐이 보여요.', '준비한 내용이 딱 맞아떨어지는 하루예요.', '오늘은 회의실에서 은근히 신뢰를 얻을 수 있어요.'],
    neutral: ['오늘 회의는 그냥 무난하게 흘러갈 것 같아요.', '특별히 튈 필요 없이 자리만 지켜도 되는 하루예요.', '오늘은 듣는 역할에 충실해도 괜찮아요.', '안건이 무난하게 정리될 하루예요.', '오늘은 굳이 먼저 나서지 않아도 되는 회의예요.'],
    challenging: ['오늘은 갑작스러운 질문이 훅 들어올 수 있으니 대비해두세요.', '회의가 예상보다 길어질 조짐이 보여요.', '오늘은 발언 타이밍을 조금 신중히 잡는 게 좋겠어요.', '갑자기 안건이 늘어날 수 있는 하루예요.', '오늘은 침묵도 전략이 될 수 있어요.']
  }},
  { id: 'coworker', emoji: '🤝', label: '이번 주 동료운', phrases: {
    positive: ['이번 주, 동료와 손발이 잘 맞는 순간이 많을 거예요.', '도움이 필요할 때 딱 나서주는 동료가 있을 주예요.', '이번 주는 동료 사이에 훈훈한 기류가 흐를 것 같아요.', '작은 배려가 오가는 편안한 한 주가 될 거예요.', '이번 주는 함께 일하는 재미를 느낄 수 있어요.'],
    neutral: ['이번 주는 각자 할 일에 집중하는 조용한 흐름이에요.', '특별한 갈등도 특별한 친밀함도 없는 무난한 한 주예요.', '적당한 거리감이 오히려 편안한 주예요.', '이번 주는 필요한 협업만 딱 하고 넘어가면 돼요.', '잔잔하게 지나가는 한 주가 될 것 같아요.'],
    challenging: ['이번 주는 사소한 오해가 생기지 않게 말을 조금 더 신경 쓰세요.', '협업 중 의견 차이가 생길 수 있는 주예요.', '이번 주는 혼자 처리하는 게 마음 편할 수도 있어요.', '온도차가 느껴지는 순간이 있을 수 있는 주예요.', '이번 주는 서로에게 조금씩 여유를 주는 게 좋겠어요.']
  }},
  { id: 'promotion', emoji: '📈', label: '올해 승진운', phrases: {
    positive: ['올해, 그동안의 노력이 직급으로 이어질 가능성이 보여요.', '승진 이야기가 생각보다 빨리 나올 수 있는 해예요.', '올해는 나를 알아봐 주는 사람이 나타날 시기예요.', '준비된 사람에게 기회가 오는 해가 될 것 같아요.', '올해는 좋은 평가로 이어질 흐름이 보여요.'],
    neutral: ['올해는 승진보다 내실을 다지기 좋은 시기예요.', '큰 변화보다는 꾸준함이 어울리는 해예요.', '지금은 결과보다 과정에 집중해도 괜찮아요.', '올해는 다음을 위한 준비의 해로 봐도 좋아요.', '조급해하지 않아도 되는 흐름이에요.'],
    challenging: ['올해는 승진 이야기가 조금 늦어질 수도 있어요.', '예상한 시기보다 결과가 미뤄질 수 있어요.', '올해는 다른 사람과 비교하지 않는 게 마음 편해요.', '성과가 바로 드러나지 않아도 괜찮아요.', '올해는 인내심이 조금 더 필요한 해가 될 수 있어요.']
  }},
  { id: 'lunch', emoji: '🍱', label: '오늘의 점심 메뉴운', phrases: {
    positive: ['오늘은 평소 안 먹던 메뉴에 도전해보면 성공할 것 같아요.', '동료가 추천하는 메뉴를 따라가면 만족스러울 거예요.', '오늘 점심, 웨이팅 없이 딱 들어갈 수 있는 운이에요.', '오늘은 조금 비싼 메뉴로 나를 챙겨줘도 좋은 날이에요.', '오늘의 선택이 하루의 기분을 살려줄 거예요.'],
    neutral: ['오늘은 그냥 무난한 메뉴로 가는 게 제일 편해요.', '늘 먹던 걸 먹어도 후회 없는 하루예요.', '오늘은 특별한 메뉴보다 익숙한 게 어울려요.', '동료 의견을 따라가도 무난한 하루예요.', '오늘은 가볍게 먹고 넘어가도 좋아요.'],
    challenging: ['오늘은 새로운 메뉴보다 검증된 메뉴가 안전해요.', '웨이팅이 길어질 수 있으니 여유 있게 움직이세요.', '오늘은 과식하면 오후가 힘들어질 수 있어요.', '메뉴 고민이 길어질 수 있는 점심시간이에요.', '오늘은 그냥 동료 의견에 따르는 게 마음 편해요.']
  }},
  { id: 'weekend', emoji: '🛌', label: '주말 회복운', phrases: {
    positive: ['이번 주말, 몸도 마음도 확실히 충전되는 시간이 될 거예요.', '아무것도 안 해도 죄책감 없는, 온전히 편안한 주말이에요.', '이번 주말은 오랜만에 푹 쉬어지는 시기예요.', '좋아하는 걸 하기에 딱 좋은 컨디션의 주말이에요.', '이번 주말은 에너지가 확실히 채워질 거예요.'],
    neutral: ['이번 주말은 특별한 계획 없이 흘러가는 대로 두는 것도 좋아요.', '무리하지 않는 선에서 보내는 게 어울리는 주말이에요.', '이번 주말은 반은 쉬고 반은 정리하기 좋은 시기예요.', '소소한 일정 정도면 충분한 주말이에요.', '이번 주말은 평소 페이스대로 흘러갈 것 같아요.'],
    challenging: ['이번 주말은 무리한 약속은 조금 줄이는 게 좋겠어요.', '생각보다 피로가 늦게 풀릴 수 있으니 여유를 두세요.', '이번 주말은 억지로 뭔가 하려 하지 않아도 괜찮아요.', '컨디션 난조가 있을 수 있으니 무리하지 마세요.', '이번 주말은 최소한의 일정만 남겨두는 게 좋아요.']
  }}
];

const ENERGY_LABEL = { positive: '긍정', neutral: '중립', challenging: '도전' };
const DRAW_KEY = 'tarot_draws';

/* ===== Utilities ===== */
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function loadDraws() { try { return JSON.parse(localStorage.getItem(DRAW_KEY) || '{}'); } catch (e) { return {}; } }
function saveDraws(d) { localStorage.setItem(DRAW_KEY, JSON.stringify(d)); }
function getCategory(id) { return CATEGORIES.find(c => c.id === id); }

/* ===== Draw logic ===== */
function drawForCategory(categoryId) {
  const cardIndex = Math.floor(Math.random() * CARDS.length);
  const card = CARDS[cardIndex];
  const pool = getCategory(categoryId).phrases[card.energy];
  const lineIndex = Math.floor(Math.random() * pool.length);
  const draw = { date: todayStr(), cardIndex, lineIndex };
  const draws = loadDraws();
  draws[categoryId] = draw;
  saveDraws(draws);
  return draw;
}

function getTodayDraw(categoryId) {
  const draws = loadDraws();
  const d = draws[categoryId];
  if (d && d.date === todayStr()) return d;
  return null;
}

/* ===== Rendering ===== */
const stage = document.getElementById('stage');

function render() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('cat') && params.has('card') && params.has('line')) {
    renderSharedResult(params);
    return;
  }
  renderCategoryList();
}

function renderCategoryList() {
  const draws = loadDraws();
  const today = todayStr();
  const cardsHtml = CATEGORIES.map(cat => {
    const done = draws[cat.id] && draws[cat.id].date === today;
    return `
      <div class="category-card ${done ? 'done' : ''}" onclick="openCategory('${cat.id}')">
        <div class="cat-emoji">${cat.emoji}</div>
        <div class="cat-label">${cat.label}</div>
        <div class="cat-status">${done ? '오늘의 결과 보기' : '뽑기 가능'}</div>
      </div>
    `;
  }).join('');

  stage.innerHTML = `
    <div class="hero">
      <div class="hero-emoji">🔮</div>
      <div class="hero-title">오늘의 타로</div>
      <div class="hero-sub">궁금한 항목을 골라 카드를 한 장 뽑아보세요</div>
    </div>
    <div class="category-grid">${cardsHtml}</div>
  `;
}

function openCategory(categoryId) {
  const existing = getTodayDraw(categoryId);
  if (existing) {
    renderResult(categoryId, existing, false);
  } else {
    renderDrawPrompt(categoryId);
  }
}

function renderDrawPrompt(categoryId) {
  const cat = getCategory(categoryId);
  stage.innerHTML = `
    <div class="draw-stage">
      <div class="hero-title" style="margin-bottom:6px;">${cat.emoji} ${cat.label}</div>
      <div class="hero-sub" style="margin-bottom:20px;">카드를 눌러 오늘의 카드를 뽑아보세요</div>
      <div class="card-back" onclick="handleDraw('${categoryId}')">🔮</div>
      <button class="action-btn" onclick="render()">목록으로</button>
    </div>
  `;
}

function handleDraw(categoryId) {
  const draw = drawForCategory(categoryId);
  renderResult(categoryId, draw, true);
}

function renderResult(categoryId, draw, isFresh) {
  const cat = getCategory(categoryId);
  const card = CARDS[draw.cardIndex];
  const line = cat.phrases[card.energy][draw.lineIndex];
  const shareUrl = buildShareUrl(categoryId, draw);

  stage.innerHTML = `
    <div class="draw-stage">
      <div class="hero-title" style="margin-bottom:14px;">${cat.emoji} ${cat.label}</div>
      ${isFresh ? '' : '<div class="shared-banner">오늘 이미 뽑은 결과예요. 내일 다시 뽑을 수 있어요.</div>'}
      <div class="card-reveal">
        <div class="card-emoji">${card.emoji}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-keyword">${card.keyword}</div>
        <div class="energy-tag ${card.energy}">${ENERGY_LABEL[card.energy]}</div>
      </div>
      <div class="result-text">${line}</div>
      <div class="share-row">
        <button class="action-btn primary" onclick="shareResult('${shareUrl}')">🔗 결과 공유하기</button>
        <button class="action-btn" onclick="render()">목록으로</button>
      </div>
      <div class="footer-note">이 항목은 내일 다시 뽑을 수 있어요.</div>
    </div>
  `;
}

function renderSharedResult(params) {
  const categoryId = params.get('cat');
  const cardIndex = parseInt(params.get('card'), 10);
  const lineIndex = parseInt(params.get('line'), 10);
  const cat = getCategory(categoryId);
  const card = CARDS[cardIndex];

  if (!cat || !card || !cat.phrases[card.energy] || !cat.phrases[card.energy][lineIndex]) {
    stage.innerHTML = `<div class="hero"><div class="hero-title">결과를 찾을 수 없어요</div></div>
      <div style="text-align:center;"><button class="action-btn primary" onclick="location.href='index.html'">내 카드 뽑으러 가기</button></div>`;
    return;
  }

  const line = cat.phrases[card.energy][lineIndex];
  stage.innerHTML = `
    <div class="draw-stage">
      <div class="shared-banner">누군가 나눠준 오늘의 타로 결과예요 🔮</div>
      <div class="hero-title" style="margin-bottom:14px;">${cat.emoji} ${cat.label}</div>
      <div class="card-reveal">
        <div class="card-emoji">${card.emoji}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-keyword">${card.keyword}</div>
        <div class="energy-tag ${card.energy}">${ENERGY_LABEL[card.energy]}</div>
      </div>
      <div class="result-text">${line}</div>
      <div class="share-row">
        <button class="action-btn primary" onclick="location.href='index.html'">나도 뽑아보기</button>
      </div>
    </div>
  `;
}

/* ===== Share ===== */
function buildShareUrl(categoryId, draw) {
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('cat', categoryId);
  url.searchParams.set('card', draw.cardIndex);
  url.searchParams.set('line', draw.lineIndex);
  return url.toString();
}

function shareResult(url) {
  if (navigator.share) {
    navigator.share({ title: '오늘의 타로', text: '오늘 뽑은 타로 결과를 확인해보세요!', url }).catch(() => {});
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
