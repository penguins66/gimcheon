import type { RaceDef } from '../sim/types';
import { CONFIG } from '../config';
import { Grid } from './Grid';

export interface PlacedUnit {
  instanceId:    number;
  defId:         string;
  mutationLevel: number; // 0 = 기본, 1+ = 부화장 돌연변이
}

// 준비기간 배치 상태. 칸당 유닛 리스트를 들고, 인원 상한/칸 용량을 강제.
export class Board {
  private cells = new Map<number, PlacedUnit[]>();
  private nextInstanceId = 1;

  devPathChosen = false;
  currentCap: number = CONFIG.capacity.start;

  /** 이 보드를 사용하는 플레이어 소유자 (0=하단 진영, 1=상단 진영) */
  readonly placerOwner: 0 | 1;

  constructor(
    public readonly grid: Grid,
    public readonly race: RaceDef,
    placerOwner: 0 | 1 = 0,
  ) {
    this.placerOwner = placerOwner;
  }

  /** 이 보드의 유효 배치 행인지 확인 */
  isInZone(row: number): boolean {
    return this.placerOwner === 0
      ? this.grid.isPlayerZone(row)
      : this.grid.isEnemyZone(row);
  }

  cellCapacity(): number {
    if (this.devPathChosen && this.race.cellCapacityAfterDevPath) {
      return this.race.cellCapacityAfterDevPath;
    }
    return this.race.cellCapacity;
  }

  unitCap(): number { return this.currentCap; }

  unitsAt(cellId: number): PlacedUnit[] {
    return this.cells.get(cellId) ?? [];
  }

  totalPlaced(): number {
    let n = 0;
    for (const arr of this.cells.values()) n += arr.length;
    return n;
  }

  canPlaceAt(cellId: number): boolean {
    const { row } = this.grid.coord(cellId);
    if (!this.isInZone(row)) return false;
    if (this.totalPlaced() >= this.unitCap()) return false;
    if (this.unitsAt(cellId).length >= this.cellCapacity()) return false;
    return true;
  }

  place(cellId: number, defId: string, mutationLevel = 0): PlacedUnit | null {
    if (!this.canPlaceAt(cellId)) return null;
    const unit: PlacedUnit = { instanceId: this.nextInstanceId++, defId, mutationLevel };
    const arr = this.cells.get(cellId);
    if (arr) arr.push(unit);
    else this.cells.set(cellId, [unit]);
    return unit;
  }

  // 해당 칸 맨 위 유닛 제거
  removeTopAt(cellId: number): PlacedUnit | null {
    const arr = this.cells.get(cellId);
    if (!arr || arr.length === 0) return null;
    const removed = arr.pop() ?? null;
    if (arr.length === 0) this.cells.delete(cellId);
    return removed;
  }

  clear(): void {
    this.cells.clear();
  }

  allPlacements(): { cellId: number; units: PlacedUnit[] }[] {
    return [...this.cells.entries()].map(([cellId, units]) => ({ cellId, units }));
  }
}
