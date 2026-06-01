import type { UnitDef } from '../../sim/types';
import { NATURE_UNITS } from './nature';

// 모든 유닛 레지스트리. 새 유닛/종족은 여기에 spread로 추가.
export const ALL_UNITS: UnitDef[] = [
  ...NATURE_UNITS,
  // ...HUMAN_UNITS (M6), ...DEMON_UNITS (M7)
];

export const UNITS: Record<string, UnitDef> = Object.fromEntries(
  ALL_UNITS.map((u) => [u.id, u]),
);

export function getUnit(id: string): UnitDef {
  const u = UNITS[id];
  if (!u) throw new Error(`Unknown unit id: ${id}`);
  return u;
}
