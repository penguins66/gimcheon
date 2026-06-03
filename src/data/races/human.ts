import type { RaceDef } from '../../sim/types';
import { HUMAN_BASE_UNITS, HUMAN_ADVANCED_UNITS, HUMAN_MAGIC_UNITS } from '../units/human';

export const HUMAN_RACE: RaceDef = {
  id: 'human',
  name: '인간',
  baseUnitIds: HUMAN_BASE_UNITS.map((u) => u.id),
  buildingIds: ['production', 'researchLab', 'capacity', 'eraEvolution'],
  devPaths: [
    {
      id: 'human.advanced',
      raceId: 'human',
      name: '첨단의 길',
      unlockTurn: 7,
      condition: { kind: 'era', min: 4 }, // 근대 이상
      unitsUnlocked: HUMAN_ADVANCED_UNITS.map((u) => u.id),
    },
    {
      id: 'human.magic',
      raceId: 'human',
      name: '마법의 길',
      unlockTurn: 7,
      condition: { kind: 'era', max: 3 }, // 중세 이하
      unitsUnlocked: HUMAN_MAGIC_UNITS.map((u) => u.id),
    },
  ],
  mechanic: 'era',
  cellCapacity: 1,
};
