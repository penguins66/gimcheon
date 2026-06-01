import type { UnitDef, TargetingFlags } from '../../sim/types';

const GROUND: TargetingFlags = { canHitAir: false, canHitUnderground: false };
const AIR:    TargetingFlags = { canHitAir: true,  canHitUnderground: false };
// 지하 박쥐: 지상·공중 모두 공격 가능
const AIR_ALL: TargetingFlags = { canHitAir: true, canHitUnderground: true };

// ── 기본 유닛 10종 ─────────────────────────────────────────────────────────
// 연구 노드: 공격력/방어력/공격속도 3개 + 어빌리티 (총합 Lv 임계치 달성 시 해금)
export const NATURE_BASE_UNITS: UnitDef[] = [
  {
    id: 'nature.wildDogs', raceId: 'nature', name: '들개 무리', layer: 'ground',
    cost: 1, tier: 1,
    baseStats: { hp: 260, atk: 20, attackSpeed: 1.2, moveSpeed: 3.8, range: 1, defense: 2 },
    radius: 0.30, targeting: GROUND,
    visual: { shape: 'circle', color: '#9aa84f', emoji: '🐕' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.10 },
      ability: {
        abilityId: 'wildDogs.rabies',
        name: '광견병',
        description: '공격 시 30% 확률로 대상에게 광란 상태이상 부여 (3초간 무작위 타겟 공격)',
        cost: 6, requiresTotalLevel: 3,
      },
    },
  },
  {
    id: 'nature.wolf', raceId: 'nature', name: '늑대', layer: 'ground',
    cost: 1, tier: 1,
    baseStats: { hp: 350, atk: 28, attackSpeed: 1.0, moveSpeed: 3.5, range: 1, defense: 5 },
    radius: 0.34, targeting: GROUND,
    visual: { shape: 'circle', color: '#6b8e23', emoji: '🐺' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 6 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.08 },
      ability: {
        abilityId: 'wolf.packLeader',
        name: '우두머리',
        description: '아군 늑대 3마리 이상 생존 시 모든 아군 늑대 공격력 +20, 방어력 +3',
        cost: 8, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.boar', raceId: 'nature', name: '멧돼지', layer: 'ground',
    cost: 2, tier: 1,
    baseStats: { hp: 700, atk: 30, attackSpeed: 0.7, moveSpeed: 3.0, range: 1, defense: 12 },
    radius: 0.40, targeting: GROUND,
    visual: { shape: 'circle', color: '#8d6e63', emoji: '🐗' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 6 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.05 },
      ability: {
        abilityId: 'boar.charge',
        name: '돌진',
        description: '전투 시작 시 이동속도 3배로 돌진 (개발 예정)',
        cost: 6, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.spiketoad', raceId: 'nature', name: '가시 두꺼비', layer: 'ground',
    cost: 2, tier: 2,
    baseStats: { hp: 450, atk: 22, attackSpeed: 0.9, moveSpeed: 2.0, range: 3, defense: 6 },
    radius: 0.34, targeting: GROUND,
    visual: { shape: 'circle', color: '#3f7d3f', emoji: '🐸' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.08 },
      ability: {
        abilityId: 'spiketoad.poisonCloud',
        name: '독 구름',
        description: '사망 시 주변 적에게 독 상태이상 부여 (개발 예정)',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.bear', raceId: 'nature', name: '곰', layer: 'ground',
    cost: 3, tier: 2,
    baseStats: { hp: 1100, atk: 55, attackSpeed: 0.7, moveSpeed: 2.2, range: 1, defense: 18 },
    radius: 0.46, targeting: GROUND,
    visual: { shape: 'circle', color: '#6d4c41', emoji: '🐻' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 10 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.06 },
      ability: {
        abilityId: 'bear.rage',
        name: '격노',
        description: 'HP 50% 이하 시 공격력 +30% (개발 예정)',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },
  {
    id: 'nature.thornvine', raceId: 'nature', name: '가시덩굴', layer: 'ground',
    cost: 3, tier: 2,
    baseStats: { hp: 600, atk: 18, attackSpeed: 0.8, moveSpeed: 1.2, range: 4, defense: 10 },
    radius: 0.38, targeting: GROUND,
    visual: { shape: 'triangle', color: '#4caf50', emoji: '🌿' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'thornvine.thornArmor',
        name: '가시 갑옷',
        description: '공격받을 때 반사 데미지 부여 (개발 예정)',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.rhino', raceId: 'nature', name: '뿔소', layer: 'ground',
    cost: 4, tier: 3,
    baseStats: { hp: 1600, atk: 60, attackSpeed: 0.5, moveSpeed: 2.0, range: 1, defense: 25 },
    radius: 0.50, targeting: GROUND,
    visual: { shape: 'square', color: '#78909c', emoji: '🦏' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 12 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 5 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.05 },
      ability: {
        abilityId: 'rhino.indomitable',
        name: '불굴',
        description: '첫 치명상을 HP 1로 버팀 (개발 예정)',
        cost: 9, requiresTotalLevel: 5,
      },
    },
  },
  {
    id: 'nature.giantSpider', raceId: 'nature', name: '거대 거미', layer: 'ground',
    cost: 4, tier: 3,
    baseStats: { hp: 800, atk: 45, attackSpeed: 0.8, moveSpeed: 2.5, range: 3, defense: 12 },
    radius: 0.42, targeting: GROUND,
    visual: { shape: 'circle', color: '#5d4037', emoji: '🕷️' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 9 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'giantSpider.venom',
        name: '독거미',
        description: '공격 시 독 상태이상 부여 (개발 예정)',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },
  {
    id: 'nature.hornets', raceId: 'nature', name: '말벌 떼', layer: 'air',
    cost: 2, tier: 2,
    baseStats: { hp: 320, atk: 18, attackSpeed: 1.4, moveSpeed: 4.2, range: 1, defense: 3 },
    radius: 0.32, targeting: AIR,
    visual: { shape: 'triangle', color: '#fbc02d', emoji: '🐝' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.12 },
      ability: {
        abilityId: 'hornets.swarmStrike',
        name: '집단 공격',
        description: '같은 대상을 공격하는 아군 말벌 수에 비례 데미지 증가 (개발 예정)',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.eagle', raceId: 'nature', name: '독수리', layer: 'air',
    cost: 3, tier: 3,
    baseStats: { hp: 500, atk: 50, attackSpeed: 1.1, moveSpeed: 4.0, range: 2, defense: 6 },
    radius: 0.38, targeting: AIR,
    visual: { shape: 'triangle', color: '#a1887f', emoji: '🦅' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 10 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.09 },
      ability: {
        abilityId: 'eagle.divebomb',
        name: '급강하',
        description: '전투 시작 시 무작위 적 1기에게 강력한 기습 공격 (개발 예정)',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },
];

// ── 발전 유닛: 고대(Ancient) 4종 ──────────────────────────────────────────
// 강력한 고대 생물들. 7턴 이후 '고대의 길' 선택 시 해금.
export const NATURE_ANCIENT_UNITS: UnitDef[] = [
  {
    id: 'nature.tyranno', raceId: 'nature', name: '티라노', layer: 'ground',
    cost: 3, tier: 2,
    baseStats: { hp: 750, atk: 68, attackSpeed: 0.75, moveSpeed: 3.8, range: 1, defense: 8 },
    radius: 0.46, targeting: GROUND,
    visual: { shape: 'circle', color: '#7b5c2a', emoji: '🦖' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 13 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'tyranno.roar',
        name: '공포의 포효',
        description: '전투 시작 시 적 전체에게 5초간 ATK -20% · 이동속도 -30% 광역 디버프 (개발 예정)',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.mammoth', raceId: 'nature', name: '매머드', layer: 'ground',
    cost: 5, tier: 3,
    baseStats: { hp: 2400, atk: 72, attackSpeed: 0.45, moveSpeed: 2.3, range: 1, defense: 28 },
    radius: 0.52, targeting: GROUND,
    visual: { shape: 'circle', color: '#8d6e63', emoji: '🦣' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 14 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 5 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.04 },
      ability: {
        abilityId: 'mammoth.warcry',
        name: '전쟁의 함성',
        description: '전투 시작 시 아군 전체 ATK+20·DEF+5 (5초 statBuff) + 적 전체 ATK-20·이속-25% (5초 디버프) (개발 예정)',
        cost: 9, requiresTotalLevel: 5,
      },
    },
  },
  {
    id: 'nature.stoneTurtle', raceId: 'nature', name: '돌 거북', layer: 'ground',
    cost: 4, tier: 3,
    baseStats: { hp: 3000, atk: 28, attackSpeed: 0.35, moveSpeed: 0.6, range: 1, defense: 42 },
    radius: 0.48, targeting: GROUND,
    visual: { shape: 'square', color: '#78909c', emoji: '🐢' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 6 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 8 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.04 },
      ability: {
        abilityId: 'stoneTurtle.fortress',
        name: '철옹성',
        description: 'HP 30% 이하 시 방어력이 2배가 됨 (개발 예정)',
        cost: 8, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.dragon', raceId: 'nature', name: '드래곤', layer: 'air',
    cost: 6, tier: 3,
    baseStats: { hp: 1800, atk: 100, attackSpeed: 0.9, moveSpeed: 3.5, range: 2, defense: 18 },
    radius: 0.50, targeting: AIR,
    visual: { shape: 'triangle', color: '#c62828', emoji: '🐲' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 5, maxLevel: 3, addPerLevel: 18 },
      defense:     { cost: 5, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 5, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'dragon.breathFire',
        name: '화염 브레스',
        description: '공격 시 10% 확률로 전방 직선 상 적 전체에게 ATK×2 화염 피해 (개발 예정)',
        cost: 10, requiresTotalLevel: 5,
      },
    },
  },
];

// ── 발전 유닛: 지하(Underground) 4종 ──────────────────────────────────────
// 독·기습 특화 지하 생물들. 7턴 이후 '지하의 길' 선택 시 해금.
export const NATURE_UNDERGROUND_UNITS: UnitDef[] = [
  {
    id: 'nature.moldCrawler', raceId: 'nature', name: '굼벵이', layer: 'ground',
    cost: 2, tier: 1,
    baseStats: { hp: 360, atk: 26, attackSpeed: 1.3, moveSpeed: 3.6, range: 1, defense: 3 },
    radius: 0.30, targeting: GROUND,
    visual: { shape: 'circle', color: '#a5d6a7', emoji: '🪱' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.12 },
      ability: {
        abilityId: 'moldCrawler.acid',
        name: '산성 분비',
        description: '공격 시 대상 방어력을 3초간 50% 감소 (개발 예정)',
        cost: 5, requiresTotalLevel: 3,
      },
    },
  },
  {
    id: 'nature.scorpion', raceId: 'nature', name: '전갈', layer: 'ground',
    cost: 3, tier: 2,
    baseStats: { hp: 560, atk: 36, attackSpeed: 0.85, moveSpeed: 2.7, range: 1, defense: 9 },
    radius: 0.36, targeting: GROUND,
    visual: { shape: 'circle', color: '#f9a825', emoji: '🦂' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 7 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.08 },
      ability: {
        abilityId: 'scorpion.venomStrike',
        name: '독침',
        description: '공격 시 50% 확률로 독 상태이상 부여 — 5초간 매초 체력 2% 감소 (개발 예정)',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },
  {
    id: 'nature.caveBat', raceId: 'nature', name: '동굴 박쥐', layer: 'air',
    cost: 2, tier: 2,
    baseStats: { hp: 250, atk: 21, attackSpeed: 1.9, moveSpeed: 5.5, range: 1, defense: 2 },
    radius: 0.28, targeting: AIR_ALL,
    visual: { shape: 'triangle', color: '#7b1fa2', emoji: '🦇' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.15 },
      ability: {
        abilityId: 'caveBat.echolocation',
        name: '음파 탐지',
        description: '공격속도 +30% · 회피율 +20% (개발 예정)',
        cost: 6, requiresTotalLevel: 3,
      },
    },
  },
  {
    id: 'nature.giantCentipede', raceId: 'nature', name: '지네', layer: 'ground',
    cost: 4, tier: 3,
    baseStats: { hp: 1300, atk: 58, attackSpeed: 0.65, moveSpeed: 2.1, range: 1, defense: 16 },
    radius: 0.42, targeting: GROUND,
    visual: { shape: 'circle', color: '#ef6c00', emoji: '🐛' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 11 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.06 },
      ability: {
        abilityId: 'giantCentipede.venomBurst',
        name: '독 폭발',
        description: '사망 시 주변 2칸 내 적에게 현재 HP의 30%에 해당하는 독 피해 (개발 예정)',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },
];

// 전체 자연 유닛 (기본 + 발전)
export const NATURE_UNITS: UnitDef[] = [
  ...NATURE_BASE_UNITS,
  ...NATURE_ANCIENT_UNITS,
  ...NATURE_UNDERGROUND_UNITS,
];
