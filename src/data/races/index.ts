import type { RaceDef } from '../../sim/types';
import { NATURE_RACE } from './nature';

// 종족 레지스트리. 인간(M6)·마계(M7)는 추후 추가.
export const RACES: Record<string, RaceDef> = {
  nature: NATURE_RACE,
};

export function getRace(id: string): RaceDef {
  const r = RACES[id];
  if (!r) throw new Error(`Unknown race id: ${id}`);
  return r;
}
