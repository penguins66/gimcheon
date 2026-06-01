import { CONFIG } from '../config';

export interface CellCoord {
  col: number;
  row: number;
}

// 그리드 좌표/영역 헬퍼. 아래 playerRows 행 = 내 진영.
export class Grid {
  readonly cols = CONFIG.grid.cols;
  readonly rows = CONFIG.grid.rows;
  readonly playerRows = CONFIG.grid.playerRows;

  cellId(col: number, row: number): number {
    return row * this.cols + col;
  }

  coord(cellId: number): CellCoord {
    return { col: cellId % this.cols, row: Math.floor(cellId / this.cols) };
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  // 내 진영 = 아래쪽 playerRows 행
  isPlayerZone(row: number): boolean {
    return row >= this.rows - this.playerRows;
  }

  isEnemyZone(row: number): boolean {
    return row < this.rows - this.playerRows;
  }
}
