import type { Grid } from '../game/Grid';
import type { SimPlacement } from '../sim/Simulation';

// M2 고정 AI 포메이션 (자연 종족, top 4 rows = 행 0~3).
// 행 3 = AI 최전선(player 진영에 가장 가까운 행).
// M8에서 동적 AI로 교체.
export function createAiPlacements(grid: Grid): SimPlacement[] {
  const f: [col: number, row: number, defId: string][] = [
    // 최전선 (row 3) — 탱커·브루저
    [0, 3, 'nature.bear'],
    [1, 3, 'nature.boar'],
    [2, 3, 'nature.rhino'],
    [3, 3, 'nature.bear'],
    [4, 3, 'nature.rhino'],
    [5, 3, 'nature.boar'],
    [6, 3, 'nature.bear'],
    // 중열 (row 2) — 근접 딜러 + 원거리
    [1, 2, 'nature.wolf'],
    [2, 2, 'nature.spiketoad'],
    [3, 2, 'nature.wolf'],
    [4, 2, 'nature.spiketoad'],
    [5, 2, 'nature.wolf'],
    // 후열 (row 1) — 원거리
    [1, 1, 'nature.giantSpider'],
    [3, 1, 'nature.thornvine'],
    [5, 1, 'nature.giantSpider'],
    // 후방 (row 0) — 공중
    [1, 0, 'nature.hornets'],
    [3, 0, 'nature.eagle'],
    [5, 0, 'nature.hornets'],
  ];

  return f.map(([col, row, defId]) => ({ cellId: grid.cellId(col, row), defId }));
}
