import type { UnitDef, TargetingFlags } from '../../sim/types';

// ── 타겟팅 플래그 ─────────────────────────────────────────────────────────
const MELEE_GROUND:  TargetingFlags = { canHitAir: false, canHitUnderground: false };
const RANGED_GROUND: TargetingFlags = { canHitAir: true,  canHitUnderground: false };
const AIR:           TargetingFlags = { canHitAir: true,  canHitUnderground: false };

// ── 기본 유닛 10종 ─────────────────────────────────────────────────────────
export const NATURE_BASE_UNITS: UnitDef[] = [
  // ── 1코스트 전선 탱커 ─────────────────────────────────────────────────
  {
    id: 'nature.wildDogs', raceId: 'nature', name: '들개 무리',
    layer: 'ground', role: 'tank',
    cost: 1, tier: 1,
    baseStats: { hp: 294, atk: 14, attackSpeed: 0.75, moveSpeed: 2.4, range: 1, defense: 15 },
    radius: 0.23, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#9aa84f', emoji: '🐕' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.12 },
      ability: {
        abilityId: 'wildDogs.rabies',
        name: '광견병',
        description: '공격 시 30% 확률로 대상에게 광란 상태이상 부여 (3초간 무작위 타겟 공격)',
        cost: 6, requiresTotalLevel: 3,
      },
    },
  },

  // ── 고공격 근접 딜러 ────────────────────────────────────────────────
  {
    id: 'nature.wolf', raceId: 'nature', name: '늑대',
    layer: 'ground', role: 'melee',
    cost: 1, tier: 1,
    baseStats: { hp: 98, atk: 58, attackSpeed: 1.3, moveSpeed: 4.2, range: 1, defense: 2 },
    radius: 0.26, targeting: MELEE_GROUND,
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

  // ── 전선 탱커: 높은 HP·방어 ────────────────────────────────────────
  {
    id: 'nature.boar', raceId: 'nature', name: '멧돼지',
    layer: 'ground', role: 'tank',
    cost: 2, tier: 1,
    baseStats: { hp: 420, atk: 33, attackSpeed: 0.65, moveSpeed: 2.6, range: 1, defense: 14 },
    radius: 0.32, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#8d6e63', emoji: '🐗' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.05 },
      ability: {
        abilityId: 'boar.charge',
        name: '돌진',
        description: '전투 시작 시 이동속도 3배로 돌진',
        cost: 6, requiresTotalLevel: 4,
      },
    },
  },

  // ── 원거리 지원: 독 분사 ──────────────────────────────────────────
  {
    id: 'nature.cobra', raceId: 'nature', name: '코브라',
    layer: 'ground', role: 'ranged',
    cost: 2, tier: 2,
    baseStats: { hp: 196, atk: 28, attackSpeed: 0.85, moveSpeed: 1.5, range: 3, defense: 5 },
    radius: 0.26, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#5d7a1f', emoji: '🐍' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.08 },
      ability: {
        abilityId: 'cobra.venomSpit',
        name: '독 분사',
        description: '공격 시 50% 확률로 대상에게 독 상태이상 부여',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },

  // ── 중탱커: 높은 체력과 방어 ────────────────────────────────────────
  {
    id: 'nature.bear', raceId: 'nature', name: '곰',
    layer: 'ground', role: 'tank',
    cost: 3, tier: 2,
    baseStats: { hp: 588, atk: 58, attackSpeed: 0.65, moveSpeed: 2.0, range: 1, defense: 20 },
    radius: 0.34, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#6d4c41', emoji: '🐻' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 10 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.06 },
      ability: {
        abilityId: 'bear.rage',
        name: '격노',
        description: 'HP 50% 이하 시 공격력 +30%',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },

  // ── 원거리 저격: 가시 발사, 초장거리 ────────────────────────────────
  {
    id: 'nature.porcupine', raceId: 'nature', name: '호저',
    layer: 'ground', role: 'ranged',
    cost: 3, tier: 2,
    baseStats: { hp: 245, atk: 26, attackSpeed: 0.75, moveSpeed: 0.7, range: 5, defense: 8 },
    radius: 0.28, targeting: RANGED_GROUND,
    visual: { shape: 'triangle', color: '#a0522d', emoji: '🦔' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 5 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'porcupine.spikeArmor',
        name: '가시 갑옷',
        description: '공격받을 때 반사 데미지 부여',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },

  // ── 최전선 초중탱커 ───────────────────────────────────────────────
  {
    id: 'nature.rhino', raceId: 'nature', name: '코뿔소',
    layer: 'ground', role: 'tank',
    cost: 4, tier: 3,
    baseStats: { hp: 875, atk: 64, attackSpeed: 0.45, moveSpeed: 1.8, range: 1, defense: 28 },
    radius: 0.36, targeting: MELEE_GROUND,
    visual: { shape: 'square', color: '#78909c', emoji: '🦏' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 12 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 5 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.05 },
      ability: {
        abilityId: 'rhino.indomitable',
        name: '불굴',
        description: '첫 치명상을 HP 1로 버팀',
        cost: 9, requiresTotalLevel: 5,
      },
    },
  },

  // ── 원거리 딜러: 공중 포함 ────────────────────────────────────────
  {
    id: 'nature.giantSpider', raceId: 'nature', name: '거대 거미',
    layer: 'ground', role: 'ranged',
    cost: 4, tier: 3,
    baseStats: { hp: 364, atk: 56, attackSpeed: 0.8, moveSpeed: 2.2, range: 3, defense: 10 },
    radius: 0.30, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#5d4037', emoji: '🕷️' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 9 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 3 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'giantSpider.venom',
        name: '독거미',
        description: '공격 시 독 상태이상 부여',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },

  // ── 공중 유닛: 빠른 근접 ─────────────────────────────────────────
  {
    id: 'nature.hornets', raceId: 'nature', name: '말벌 떼',
    layer: 'air', role: 'flyer',
    cost: 2, tier: 2,
    baseStats: { hp: 147, atk: 21, attackSpeed: 1.5, moveSpeed: 4.5, range: 1, defense: 2 },
    radius: 0.23, targeting: AIR,
    visual: { shape: 'triangle', color: '#fbc02d', emoji: '🐝' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.14 },
      ability: {
        abilityId: 'hornets.swarmStrike',
        name: '집단 공격',
        description: '같은 대상을 공격하는 아군 말벌 수에 비례 데미지 증가',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },

  // ── 공중 저격: 원거리, 강력한 딜 ─────────────────────────────────
  {
    id: 'nature.eagle', raceId: 'nature', name: '독수리',
    layer: 'air', role: 'flyer',
    cost: 3, tier: 3,
    baseStats: { hp: 238, atk: 64, attackSpeed: 1.0, moveSpeed: 4.0, range: 3, defense: 5 },
    radius: 0.28, targeting: AIR,
    visual: { shape: 'triangle', color: '#a1887f', emoji: '🦅' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 10 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.09 },
      ability: {
        abilityId: 'eagle.divebomb',
        name: '급강하',
        description: '전투 시작 시 무작위 적 1기에게 강력한 기습 공격',
        cost: 8, requiresTotalLevel: 5,
      },
    },
  },
];

// ── 발전 유닛: 고대(Ancient) 4종 ──────────────────────────────────────────
export const NATURE_ANCIENT_UNITS: UnitDef[] = [
  {
    id: 'nature.tyranno', raceId: 'nature', name: '티라노',
    layer: 'ground', role: 'melee',
    cost: 3, tier: 2,
    baseStats: { hp: 392, atk: 84, attackSpeed: 0.8, moveSpeed: 4.0, range: 1, defense: 7 },
    radius: 0.34, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#7b5c2a', emoji: '🦖' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 14 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'tyranno.roar',
        name: '공포의 포효',
        description: '전투 시작 시 적 전체에게 5초간 ATK -20% · 이동속도 -30%',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },

  {
    id: 'nature.mammoth', raceId: 'nature', name: '매머드',
    layer: 'ground', role: 'tank',
    cost: 5, tier: 3,
    baseStats: { hp: 1274, atk: 76, attackSpeed: 0.40, moveSpeed: 2.0, range: 1, defense: 30 },
    radius: 0.38, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#8d6e63', emoji: '🦣' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 14 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 5 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.04 },
      ability: {
        abilityId: 'mammoth.warcry',
        name: '전쟁의 함성',
        description: '전투 시작 시 아군 전체 ATK+20·DEF+5 / 적 전체 ATK-20·이속-25%',
        cost: 9, requiresTotalLevel: 5,
      },
    },
  },

  {
    id: 'nature.stoneTurtle', raceId: 'nature', name: '돌 거북',
    layer: 'ground', role: 'tank',
    cost: 4, tier: 3,
    baseStats: { hp: 1575, atk: 29, attackSpeed: 0.30, moveSpeed: 0.5, range: 1, defense: 45 },
    radius: 0.36, targeting: MELEE_GROUND,
    visual: { shape: 'square', color: '#78909c', emoji: '🐢' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 6 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 8 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.04 },
      ability: {
        abilityId: 'stoneTurtle.fortress',
        name: '철옹성',
        description: 'HP 30% 이하 시 방어력 2배',
        cost: 8, requiresTotalLevel: 4,
      },
    },
  },

  {
    id: 'nature.dragon', raceId: 'nature', name: '드래곤',
    layer: 'air', role: 'flyer',
    cost: 6, tier: 3,
    baseStats: { hp: 931, atk: 122, attackSpeed: 0.9, moveSpeed: 3.5, range: 2, defense: 16 },
    radius: 0.36, targeting: AIR,
    visual: { shape: 'triangle', color: '#c62828', emoji: '🐲' },
    unlock: { kind: 'devpath', pathId: 'nature.ancient' },
    research: {
      atk:         { cost: 5, maxLevel: 3, addPerLevel: 18 },
      defense:     { cost: 5, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 5, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'dragon.breathFire',
        name: '화염 브레스',
        description: '공격 시 10% 확률로 전방 직선 적 전체에게 ATK×2 화염 피해',
        cost: 10, requiresTotalLevel: 5,
      },
    },
  },
];

// ── 발전 유닛: 지하(Underground) 4종 ──────────────────────────────────────
export const NATURE_UNDERGROUND_UNITS: UnitDef[] = [
  {
    id: 'nature.moldCrawler', raceId: 'nature', name: '굼벵이',
    layer: 'underground', role: 'underground', targetPriority: 'lowest_hp',
    cost: 2, tier: 1,
    baseStats: { hp: 119, atk: 37, attackSpeed: 0.30, moveSpeed: 4.0, range: 1, defense: 4 },
    radius: 0.23, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#a5d6a7', emoji: '🪱' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 6 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'moldCrawler.acid',
        name: '산성 분비',
        description: '공격 시 대상 방어력을 3초간 50% 감소',
        cost: 5, requiresTotalLevel: 3,
      },
    },
  },

  {
    id: 'nature.scorpion', raceId: 'nature', name: '전갈',
    layer: 'underground', role: 'underground',
    cost: 3, tier: 2,
    baseStats: { hp: 140, atk: 46, attackSpeed: 0.30, moveSpeed: 2.8, range: 1, defense: 10 },
    radius: 0.28, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#f9a825', emoji: '🦂' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 8 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 2 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'scorpion.venomStrike',
        name: '독침',
        description: '공격 시 50% 확률로 독 부여 — 5초간 매초 HP 2% 감소',
        cost: 7, requiresTotalLevel: 4,
      },
    },
  },

  {
    id: 'nature.badger', raceId: 'nature', name: '오소리',
    layer: 'underground', role: 'underground', targetPriority: 'lowest_hp',
    cost: 2, tier: 2,
    baseStats: { hp: 63, atk: 26, attackSpeed: 0.35, moveSpeed: 5.5, range: 1, defense: 2 },
    radius: 0.22, targeting: MELEE_GROUND,
    visual: { shape: 'triangle', color: '#616161', emoji: '🦡' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 4 },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 1 },
      attackSpeed: { cost: 3, maxLevel: 3, addPerLevel: 0.05 },
      ability: {
        abilityId: 'badger.furyRush',
        name: '광폭 돌진',
        description: '잠복 해제 직후 이동속도·공격속도 2배 (1초)',
        cost: 6, requiresTotalLevel: 3,
      },
    },
  },

  {
    id: 'nature.deathworm', raceId: 'nature', name: '데스웜',
    layer: 'underground', role: 'underground',
    cost: 4, tier: 3,
    baseStats: { hp: 368, atk: 72, attackSpeed: 0.28, moveSpeed: 2.5, range: 1, defense: 18 },
    radius: 0.32, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#b71c1c', emoji: '🐛' },
    unlock: { kind: 'devpath', pathId: 'nature.underground' },
    research: {
      atk:         { cost: 4, maxLevel: 3, addPerLevel: 12 },
      defense:     { cost: 4, maxLevel: 3, addPerLevel: 4 },
      attackSpeed: { cost: 4, maxLevel: 3, addPerLevel: 0.07 },
      ability: {
        abilityId: 'deathworm.acidBurst',
        name: '산성 폭발',
        description: '사망 시 주변 2칸 내 적에게 최대 HP의 30% 산성 피해',
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
