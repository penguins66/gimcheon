// ── 픽셀 스프라이트 시스템 ────────────────────────────────────────────────
// 유닛 ID별 16×16 개별 스프라이트 + 역할별 폴백 템플릿
//
// 팔레트 문자:
//   '.' = 투명
//   'K' = 아웃라인 (#111)
//   'B' = 몸통 메인 (visual.color)
//   'b' = 그림자 (darken 35%)
//   'H' = 하이라이트 (lighten 40%)
//   'h' = 밝은 하이라이트 (lighten 65%)  ← 엄니/줄무늬/특수 디테일
//   'e' = 눈/어두운 디테일 (#080808)

export type SpriteTemplate = readonly string[];

// ── 유닛별 스프라이트 ─────────────────────────────────────────────────────
export const UNIT_SPRITES: Record<string, SpriteTemplate> = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  기본 유닛 10종
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 들개 무리 — 둥근 귀 두 개, 넓은 탱커 체형, 짧은 꼬리
  'nature.wildDogs': [
    '..KK..KK........',
    '.KBbKKBbK.......',
    'KKBBBBBBKbK.....',
    'KBBBeeBBbK......',
    'KBBBBBBBbK......',
    '.KBBBBBBbK......',
    '.KBBHBBBbK......',
    '.KBBBBBBbKKKKK..',
    '..KKBBBBBBBBBbK.',
    '....KBBBBbK.....',
    '...KBBBBBBK.....',
    '..KK.KBBbK.KK...',
    '.KBbK.KBK.KBbK..',
    '.KBbK.KKK.KBbK..',
    '..KKK.....KKK...',
    '................',
  ],

  // 늑대 — 뾰족한 귀, 날렵한 몸통, 복슬복슬한 꼬리
  'nature.wolf': [
    '..KK..KK........',
    '.KBBbKBBbK......',
    'KKBBBBBBBbK.....',
    'KBBBeBeBBbK.....',
    '.KBBBBBBBbK.....',
    '..KBBBBBBbK.....',
    '...KBBBBBbKKKK..',
    '...KBBHBBBBBbK..',
    '....KBBBBBBbBbK.',
    '.....KBBBBbbK...',
    '.....KBBBbK.....',
    '....KK.KBbK.....',
    '...KBbK.KbK.....',
    '...KBbK.KbK.....',
    '....KKK.KKK.....',
    '................',
  ],

  // 멧돼지 — 각진 넓적 머리, h로 표현한 하얀 엄니, 두꺼운 몸통
  'nature.boar': [
    '................',
    '....KKKK........',
    '...KBBBBbK......',
    '..KBBBBBBbKK....',
    '.KKBBBeeBBBbK...',
    'KhBBBBBBBBBbK...',
    '.KhBBBBBBBbK....',
    '..KKKBBBBBK.....',
    '....KBBBBbK.....',
    '...KBBBBBBK.....',
    '..KK.KBBbK.KK...',
    '.KBbK.KBK.KBbK..',
    '.KBbK.KKK.KBbK..',
    '..KKK.....KKK...',
    '................',
    '................',
  ],

  // 코브라 — 정면 펼친 갓(후드), 눈 두 개, 긴 꼬리
  'nature.cobra': [
    '................',
    '..KKKKKKKKKK....',
    '.KBBBBBBBBBbK...',
    '.KBHHBBBBHHbK...',
    'KKBBHeeBBHBbKK..',
    'KBbBBBBBBBBbbK..',
    '.KKBBBBBBBBbKK..',
    '...KKBBBBBbK....',
    '....KBBBBbK.....',
    '....KBBBBbK.....',
    '...KBBBBBbK.....',
    '..KBBBBBBbK.....',
    '..KBBBBBBbK.....',
    '...KBBBBBK......',
    '....KBBbK.......',
    '.....KKK........',
  ],

  // 곰 — 크고 둥근 머리, 큰 귀, 매우 넓은 몸통, 두꺼운 다리
  'nature.bear': [
    '..KK..KK........',
    '.KBbKKBbK.......',
    'KKBBBBBBKbK.....',
    'KBBBeBeBBbK.....',
    'KBBBBBBBBbK.....',
    '.KBBBBBBBbK.....',
    '.KBBHBBBBbK.....',
    '.KBBBBBBBbK.....',
    '..KBBBBBBbK.....',
    '..KBBBBBBK......',
    '..KBBBBBBK......',
    '.KKK.KBK.KKK....',
    'KBbbK.K.KBbbK...',
    'KBbbK.K.KBbbK...',
    '.KKKK.K.KKKK....',
    '......K.........',
  ],

  // 호저 — 등 위 가시 톱니(K/b), 작은 옆 눈, 짧은 두 발
  'nature.porcupine': [
    '...K.K.K.K......',
    '..KbKbKbKb......',
    '.KBbBbBbBb......',
    'KKBBBBBBBBbKK...',
    'KBbBBBBBBBbbK...',
    'KBbBBHBBBbbK....',
    'KBbBBBBBBbbK....',
    '.KKBBBBBBbKK....',
    '...KBBBBbK......',
    '..KKBBBBbK......',
    '.KBeKBBBbK......',
    '..KKKBBbK.......',
    '...KK.KK........',
    '..KBbKKBbK......',
    '...KKK.KKK......',
    '................',
  ],

  // 코뿔소 — 오른쪽 위 거대한 뿔(h), 초거대 몸통, 굵은 다리
  'nature.rhino': [
    '...............K',
    '.....KKKK...KhK.',
    '....KBBBbK.KhK..',
    '...KBBBBBbKBKK..',
    '..KKBBBBBBBBbK..',
    '.KBbBBBBBBBBbK..',
    '.KBbBBBHBBBBbK..',
    '.KBbBBBBBBBBbK..',
    '.KBbBBBBBBBBbK..',
    '..KKBBBBBBBbKK..',
    '....KBBBBBbK....',
    '...KK.KBK.KK....',
    '..KBbK.K.KBbK...',
    '..KBbK.K.KBbK...',
    '...KKK.K.KKK....',
    '.......K........',
  ],

  // 거대 거미 — 상하좌우 8개 다리, 앞/뒷 몸통 두 부분
  'nature.giantSpider': [
    '.K.K.......K.K..',
    '..KBK.....KBK...',
    '...KBK...KBK....',
    '....KKKKKKK.....',
    '...KBBBBBBBbK...',
    '..KBBBHBBBBbbK..',
    '..KBBBeBBBBbbK..',
    '...KKBBBBBKK....',
    '....KBBBBbK.....',
    '....KBBBBbK.....',
    '.K.K.KBBbK.K.K..',
    'KbKbK.KbK.KbKbK.',
    '.K.K.........K.K',
    '................',
    '................',
    '................',
  ],

  // 말벌 떼 — 넓은 날개, K로 표현한 검은 줄무늬, 얇은 허리
  'nature.hornets': [
    '..K..........K..',
    '.KBhK......KhBK.',
    'KBBhK......KhBBK',
    '.KBBhK....KhBBK.',
    '..KBBhKKKKhBBbK.',
    '...KKKK..KKKK...',
    '...KBBKKKKBbK...',
    '...KKKKKKKKbK...',
    '...KBBKKKKBbK...',
    '...KKKKKKKKbK...',
    '....KKKKKKKK....',
    '.....KBBbK......',
    '.....KhBK.......',
    '......KK........',
    '................',
    '................',
  ],

  // 독수리 — 넓은 날개, 밝은 H 머리(흰 독수리 머리), 발톱
  'nature.eagle': [
    'K.............K.',
    'KBhK........KhBK',
    'KBBhK......KhBBK',
    '.KBBhK....KhBBK.',
    '..KBBhKBBKhBBbK.',
    '...KBBBBBBBBbbK.',
    '...KBBBHHBBBbbK.',
    '....KBHHHHBBbK..',
    '....KBBBeBBBbK..',
    '.....KBBBBBbK...',
    '.....KBBBBbK....',
    '....KBK...KbK...',
    '...KBbK...KbbK..',
    '....KKK...KKK...',
    '................',
    '................',
  ],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  고대(Ancient) 발전 유닛 4종
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 티라노 — 옆으로 치우친 거대 머리, 짧은 앞발, 큰 뒷다리
  'nature.tyranno': [
    '................',
    '.......KKKK.....',
    '......KBBBBbK...',
    '.....KBBBeeBBbK.',
    '....KKBBBBBBbK..',
    '...KBbBBBBBBbK..',
    '..KBbBBBHBBbbK..',
    '.KKBbBBBBBBbbK..',
    '.KBbBBBBBBBbbK..',
    '..KKKBBBBBBKK...',
    '....KK.KBBK.....',
    '...KBbK.KBbK....',
    '...KBbK.KBbK....',
    '....KKKK.KKK....',
    '...KBbK.K.......',
    '....KKK.K.......',
  ],

  // 매머드 — 위로 굽은 긴 상아 두 개(h=상아색), 코 늘어짐, 초거대 몸통
  'nature.mammoth': [
    '..K.K...........',
    '.KhKhK..........',
    'KhKhKKKK........',
    '.KhBBBBBBbK.....',
    '..KBBBBBBBKK....',
    '...KKBBBBKBBBK..',
    '....KBBbKBBBbK..',
    '...KBBBBBBBBbK..',
    '..KBBBHBBBBBbbK.',
    '.KBBBBBBBBBBbbK.',
    'KBbBBBBBBBBBbbK.',
    '.KKK.KBBBK.KKK..',
    '.KBbK.KBK.KBbK..',
    '.KBbK.KKK.KBbK..',
    '..KKK.....KKK...',
    '................',
  ],

  // 돌 거북 — 넓은 등딱지 격자 문양, 작은 머리와 발
  'nature.stoneTurtle': [
    '................',
    '...KKKKKKKKK....',
    '..KBBbKBBbKBBK..',
    '.KBBBbKBBbKBBbK.',
    '.KBbKBBbKBBbKBK.',
    'KKBBBBBBBBBBBbKK',
    'KBbBBBBBBBBBBbbK',
    'KBbBBBHHBBBBbbK.',
    'KBbBBBBBBBBBbbK.',
    '.KKBBBBBBBBBbKK.',
    '..KBbBBBBBBbK...',
    '...KKK.KBK.KKK..',
    '..KBbK.KKK.KBbK.',
    '...KKK.K...KKK..',
    '......KhK.......',
    '.......K........',
  ],

  // 드래곤 — 넓은 날개, 꼬리(오른쪽 위), h로 표현한 불꽃
  'nature.dragon': [
    'K..............K',
    'KBhK........KhBK',
    'KBBhK......KhBBK',
    '.KBBhKBBBBKhBBK.',
    '..KKKKBBBBKKKbK.',
    '...KBBBBBBBBbKKK',
    '...KBBHHBBBbBBbK',
    '...KBBBeBBBbBbK.',
    '....KBBBBBBbK...',
    '....KBBBBbK.....',
    '...KK.KBbK......',
    '..KBbK.KbK......',
    '..KBbK...K......',
    '...KKK...KhK....',
    '.........KhK....',
    '..........K.....',
  ],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  지하(Underground) 발전 유닛 4종
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 굼벵이 — 통통한 유충/굼벵이, K 세그먼트 선, 작은 눈
  'nature.moldCrawler': [
    '................',
    '................',
    '....KKKKKKKK....',
    '...KBBBBBBBbK...',
    '..KBHhBBBBBbbK..',
    '.KKBHeeBBBBbbKK.',
    '.KBbBBBBBBBBbbK.',
    '.KBbBBKBBKBBbbK.',
    '.KBbBBKBBKBBbbK.',
    '.KBbBBKBBKBBbbK.',
    '.KKBBBBBBBBBbKK.',
    '..KBBBBBBBBbbK..',
    '...KKKKKKKKK....',
    '................',
    '................',
    '................',
  ],

  // 전갈 — 양쪽 집게발, 오른쪽 위로 올라간 꼬리+침
  'nature.scorpion': [
    '..K.........K...',
    '.KbK.......KbK..',
    'KBbKK.....KKBbK.',
    '.KKKKbBBBbKKKK..',
    '...KBBBBBBBbK...',
    '..KBBHBBBBBbbK..',
    '..KBBeKBBBbbK...',
    '...KKBBBBbKK....',
    '....KBBBBbK.....',
    '....KBBBbK.K....',
    '.....KBBbK.KK...',
    '......KBbK..KK..',
    '.......KbK...KhK',
    '........KK...KK.',
    '................',
    '................',
  ],

  // 오소리 — 얼굴·등의 하얀 줄무늬(h/H), 납작하고 넓은 몸통
  'nature.badger': [
    '................',
    '....KKKKKK......',
    '...KHhHHHhK.....',
    '..KBBHhHBBbK....',
    '.KKBBBhBBBbbKK..',
    'KBbBBBhBBBBbbK..',
    'KBbBBBhBBBBbbK..',
    'KBbBBBhBBBBbbK..',
    'KBbBBBBBBBBbbK..',
    '.KKBBBBBBBBbKK..',
    '...KBBBBBbK.....',
    '..KK.KBBK.KK....',
    '.KBbK.KK.KBbK...',
    '.KBbK....KBbK...',
    '..KKK....KKK....',
    '................',
  ],

  // 데스웜 — 정면 거대한 원형 입+이빨(e), 긴 몸통이 아래로 가늘어짐
  'nature.deathworm': [
    '...KKKKKK.......',
    '..KBBBBBbK......',
    '.KBHBBBBbbK.....',
    'KKBeeeeBbbKK....',
    'KBBeeeeeBbbK....',
    'KKBeeeeBbbKK....',
    '.KBHBBBBbbK.....',
    '..KBBBBBbK......',
    '...KBBBBbK......',
    '....KBBBbK......',
    '.....KBBbK......',
    '......KBbK......',
    '.......KbK......',
    '........KK......',
    '................',
    '................',
  ],
};

// ── 역할별 폴백 스프라이트 ────────────────────────────────────────────────
export const ROLE_SPRITES: Record<string, SpriteTemplate> = {
  tank: [
    '................',
    '....KKKKKK......',
    '...KBBBBBbK.....',
    '..KBHhBBBbbK....',
    '..KBHeeHBbbK....',
    '..KBBBBBBbbK....',
    '..KBBBBBBbbK....',
    '..KBBBBBBbbK....',
    '...KBBBBBBK.....',
    '...KBBBBBBK.....',
    '..KKBBBBBBKK....',
    '.KBbKBBBBbKBbK..',
    '.KBbKBBBBbKBbK..',
    '..KKKBBBBbKKK...',
    '.....KBBBbK.....',
    '......KKKK......',
  ],
  melee: [
    '................',
    '.....KKKKK......',
    '....KBBBBbK.....',
    '...KBHhBBbbK....',
    '...KBHeBBbbK....',
    '...KBBBBBbK.....',
    '....KBBBBbK.....',
    '...KBBBBBbK.....',
    '..KBBBBBBbK.....',
    '.KBBBBBBbKK.....',
    'KBbKKBBbbK......',
    'KBbK.KBbbK......',
    '.KKK..KKK.......',
    '.....KBbK.......',
    '.....KBbK.......',
    '......KKK.......',
  ],
  assassin: [
    '................',
    '......KKK.......',
    '.....KBBbK......',
    '....KBHhBbK.....',
    '....KBHeeBbK....',
    '....KBBBBbK.....',
    '...KKBBBbKK.....',
    '..KBbK.KBbK.....',
    '..KBbK.KBbK.....',
    '...KKK.KKK......',
    '.....KBBbK......',
    '....KBBBbbK.....',
    '...KBK..KbK.....',
    '..KBbK..KBbK....',
    '...KKK..KKK.....',
    '................',
  ],
  ranged: [
    '................',
    '.....KKKK.......',
    '....KBBBbK......',
    '....KBHhBbK.....',
    '....KBHeeBbK....',
    '....KBBBBbK.....',
    '....KBBBBbK.....',
    '...KBBBBBbK.....',
    '...KBBBBBbK.....',
    '...KBBBBBbK.....',
    '..KKBBBBBbKK....',
    '.KBbKBBBBbKBbK..',
    '.KBbK.KBbK.KbK..',
    '..KKK..KKK..KK..',
    '................',
    '................',
  ],
  flyer: [
    'K..............K',
    'KBhK........KhBK',
    'KBBhK......KhBBK',
    '.KBBhK....KhBBK.',
    '..KBBhKBBKhBBbK.',
    '...KBBBBBBBBbbK.',
    '...KBBBHHBBBbbK.',
    '....KBBBHBBBbK..',
    '....KBBBeBBBbK..',
    '.....KBBBBBbK...',
    '......KBBBbK....',
    '.....KBK.KbK....',
    '....KBbK.KbbK...',
    '.....KKK.KKK....',
    '................',
    '................',
  ],
  underground: [
    '................',
    '................',
    '.....KKKKK......',
    '....KBBBBbK.....',
    '...KBHhBBbbK....',
    '..KKBHeeBbbKK...',
    '.KBbBBBBBBBbbK..',
    '.KBbBBBBBBBbbK..',
    '.KBbBBBBBBBbbK..',
    '..KKBBBBBBBbKK..',
    '...KBBBBBBbbK...',
    '....KKBBBbbKK...',
    '.....KbBbbK.....',
    '......KKbK......',
    '.......KK.......',
    '................',
  ],
};

// ── 컬러 유틸 ──────────────────────────────────────────────────────────────
function clamp(v: number): number { return Math.max(0, Math.min(255, v | 0)); }

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0'), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

export function lighten(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

export function darken(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  return toHex(r * (1 - t), g * (1 - t), b * (1 - t));
}

// defId 우선 → role 폴백
export function getSpriteTemplate(defId?: string, role?: string): SpriteTemplate {
  if (defId) {
    const u = UNIT_SPRITES[defId];
    if (u) return u;
  }
  return ROLE_SPRITES[role ?? 'melee'] ?? ROLE_SPRITES['melee']!;
}
