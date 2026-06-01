import type { RaceDef } from '../sim/types';
import { CONFIG } from '../config';
import { Grid } from './Grid';

export interface PlacedUnit {
  instanceId: number;
  defId: string;
}

// 준비기간 배치 상태. 칸당 유닛 리스트를 들고, 인원 상한/칸 용량을 강제.
export class Board {
  private cells = new Map<number, PlacedUnit[]>();
  private nextInstanceId = 1;

  // 발전 완료 시 칸 용량 전환 (HUD 토글 or PlayerState.selectedDevPath)
  devPathChosen = false;
  // 전투 인원 시설 레벨로 갱신되는 동적 상한 (M3+)
  currentCap: number = CONFIG.capacity.start;

  constructor(
    public readonly grid: Grid,
    public readonly race: RaceDef,
  ) {}

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
    if (!this.grid.isPlayerZone(row)) return false;
    if (this.totalPlaced() >= this.unitCap()) return false;
    if (this.unitsAt(cellId).length >= this.cellCapacity()) return false;
    return true;
  }

  place(cellId: number, defId: string): PlacedUnit | null {
    if (!this.canPlaceAt(cellId)) return null;
    const unit: PlacedUnit = { instanceId: this.nextInstanceId++, defId };
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
