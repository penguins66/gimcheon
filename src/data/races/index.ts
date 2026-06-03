import type { RaceDef } from '../../sim/types';
import { NATURE_RACE } from './nature';
import { HUMAN_RACE }  from './human';

export const RACES: Record<string, RaceDef> = {
  nature: NATURE_RACE,
  human:  HUMAN_RACE,
  // demon: DEMON_RACE,  // M7
};

export function getRace(id: string): RaceDef {
  const r = RACES[id];
  if (!r) throw new Error(`Unknown race id: ${id}`);
  return r;
}
