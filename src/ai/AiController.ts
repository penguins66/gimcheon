import type { Grid } from '../game/Grid';
import type { SimPlacement } from '../sim/Simulation';

// AI 진영: row 0(후방) ~ row 3(최전선)
const FRONT = 3;
const MID   = 2;
const BACK  = 1;
const FAR   = 0;

type Row = [col: number, row: number, defId: string];

// ── 단계 1 (턴 1~3): 입문 — 들개 2마리 ────────────────────────────────────
// 플레이어 예상 전력: wildDogs×1~2, 1~3코인
const PHASE1: Row[] = [
  [2, FRONT, 'nature.wildDogs'],
  [4, FRONT, 'nature.wildDogs'],
];

// ── 단계 2 (턴 4~6): 쉬움 — 들개+늑대 4마리 ──────────────────────────────
// 플레이어 예상 전력: 3~5유닛 (T1 위주)
const PHASE2: Row[] = [
  [2, FRONT, 'nature.wildDogs'],
  [4, FRONT, 'nature.wildDogs'],
  [1, MID,   'nature.wolf'],
  [5, MID,   'nature.wolf'],
];

// ── 단계 3 (턴 7~9): 보통 — 7유닛, 멧돼지·두꺼비 등장 ───────────────────
// 플레이어 예상 전력: 5~7유닛 (T1~T2)
const PHASE3: Row[] = [
  [1, FRONT, 'nature.boar'],
  [3, FRONT, 'nature.wolf'],
  [5, FRONT, 'nature.boar'],
  [2, MID,   'nature.wildDogs'],
  [4, MID,   'nature.wildDogs'],
  [1, BACK,  'nature.cobra'],
  [5, BACK,  'nature.cobra'],
];

// ── 단계 4 (턴 10~12): 어려움 — 10유닛, 곰·거대거미 등장 ─────────────────
// 플레이어 예상 전력: 7~9유닛 (T2 위주)
const PHASE4: Row[] = [
  [0, FRONT, 'nature.boar'],
  [2, FRONT, 'nature.bear'],
  [3, FRONT, 'nature.wolf'],
  [4, FRONT, 'nature.bear'],
  [6, FRONT, 'nature.boar'],
  [1, MID,   'nature.cobra'],
  [3, MID,   'nature.wolf'],
  [5, MID,   'nature.cobra'],
  [2, BACK,  'nature.giantSpider'],
  [4, BACK,  'nature.giantSpider'],
];

// ── 단계 5 (턴 13+): 매우 어려움 — 14유닛, 뿔소·독수리 등장 ─────────────
// 플레이어 예상 전력: 9유닛 + 발전 경로 개방
const PHASE5: Row[] = [
  [0, FRONT, 'nature.bear'],
  [1, FRONT, 'nature.rhino'],
  [2, FRONT, 'nature.boar'],
  [3, FRONT, 'nature.bear'],
  [4, FRONT, 'nature.boar'],
  [5, FRONT, 'nature.rhino'],
  [6, FRONT, 'nature.bear'],
  [1, MID,   'nature.wolf'],
  [3, MID,   'nature.cobra'],
  [5, MID,   'nature.wolf'],
  [2, BACK,  'nature.giantSpider'],
  [4, BACK,  'nature.giantSpider'],
  [1, FAR,   'nature.hornets'],
  [5, FAR,   'nature.hornets'],
];

// turn = playerState.turn (1부터 시작, 정산 후 증가)
export function createAiPlacements(grid: Grid, turn: number): SimPlacement[] {
  const phase =
    turn <=  3 ? PHASE1 :
    turn <=  6 ? PHASE2 :
    turn <=  9 ? PHASE3 :
    turn <= 12 ? PHASE4 :
                 PHASE5;

  return phase.map(([col, row, defId]) => ({ cellId: grid.cellId(col, row), defId }));
}
