import type { RaceDef } from '../../sim/types';
import { NATURE_BASE_UNITS, NATURE_ANCIENT_UNITS, NATURE_UNDERGROUND_UNITS } from '../units/nature';

export const NATURE_RACE: RaceDef = {
  id: 'nature',
  name: '자연',
  baseUnitIds: NATURE_BASE_UNITS.map((u) => u.id),
  buildingIds: ['production', 'researchLab', 'capacity', 'hatchery'],
  devPaths: [
    {
      id: 'nature.ancient',
      raceId: 'nature',
      name: '고대의 길',
      unlockTurn: 7,
      unitsUnlocked: NATURE_ANCIENT_UNITS.map((u) => u.id),
    },
    {
      id: 'nature.underground',
      raceId: 'nature',
      name: '지하의 길',
      unlockTurn: 7,
      unitsUnlocked: NATURE_UNDERGROUND_UNITS.map((u) => u.id),
    },
  ],
  mechanic: 'hatchery',
  cellCapacity: 1,
  cellCapacityAfterDevPath: 3, // 발전 후 한 칸 최대 3유닛 (겹침 배치)
};
