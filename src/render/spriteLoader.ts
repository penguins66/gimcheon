// ── 외부 유닛 스프라이트 로더 ──────────────────────────────────────────────
// PNG 파일을 public/sprites/ 에 넣으면 자동 로드됩니다.
// 파일 명명 규칙: {unitId}.png  (점은 언더스코어로 치환)
//   예) nature.wildDogs → public/sprites/nature_wildDogs.png
//
// 파일이 없으면 오류 없이 무시되고 프로그래매틱 픽셀 스프라이트로 폴백됩니다.
// 권장 해상도: 16×16 ~ 48×48 px (정수 배수, 투명 PNG)

const cache = new Map<string, HTMLImageElement>();

function idToPath(defId: string): string {
  return `/sprites/${defId.replace('.', '_')}.png`;
}

function tryLoad(defId: string): void {
  if (cache.has(defId)) return;
  const img = new Image();
  img.onload  = () => cache.set(defId, img);
  img.onerror = () => { /* 파일 없음 → 폴백 사용 */ };
  img.src = idToPath(defId);
}

// 알려진 모든 유닛 ID — 게임 시작 시 백그라운드에서 프리로드
const KNOWN_IDS = [
  'nature.wildDogs', 'nature.wolf',        'nature.boar',       'nature.cobra',
  'nature.bear',     'nature.porcupine',   'nature.rhino',      'nature.giantSpider',
  'nature.hornets',  'nature.eagle',
  'nature.tyranno',  'nature.mammoth',     'nature.stoneTurtle','nature.dragon',
  'nature.moldCrawler','nature.scorpion',  'nature.badger',     'nature.deathworm',
];
KNOWN_IDS.forEach(tryLoad);

/** 로드된 스프라이트 이미지를 반환. 없으면 null. */
export function getUnitSprite(defId: string): HTMLImageElement | null {
  return cache.get(defId) ?? null;
}

/** 런타임에 추가 ID를 로드할 때 사용 (인간 종족 등 추가 시) */
export function preloadSprite(defId: string): void {
  tryLoad(defId);
}
