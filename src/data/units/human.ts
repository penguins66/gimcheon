import type { UnitDef, TargetingFlags } from '../../sim/types';

// ── 타겟팅 플래그 ─────────────────────────────────────────────────────────
const MELEE_GROUND:  TargetingFlags = { canHitAir: false, canHitUnderground: false };
const RANGED_GROUND: TargetingFlags = { canHitAir: true,  canHitUnderground: false };
const AIR:           TargetingFlags = { canHitAir: true,  canHitUnderground: false };

// ── 기본 유닛 7종 (스탯 기준: 철기시대 era 2) ────────────────────────────
export const HUMAN_BASE_UNITS: UnitDef[] = [
  // ── 1: 병사 — 전선 근접 탱커 ─────────────────────────────────────────
  {
    id: 'human.soldier', raceId: 'human', name: '병사',
    layer: 'ground', role: 'tank',
    cost: 2, tier: 1,
    baseStats: { hp: 800, atk: 40, attackSpeed: 0.9, moveSpeed: 2.8, range: 1, defense: 14 },
    radius: 0.30, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#5b8cd8', emoji: '⚔️' },
    eraNames:  ['곤봉전사', '병사',  '기사',       '소총병', '특수부대'],
    eraEmojis: ['🪨',       '⚔️',    '🛡️',        '🔫',     '💀'],
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 7  },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 2  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.08 },
    },
  },

  // ── 2: 궁수 — 원거리 딜러 ────────────────────────────────────────────
  {
    id: 'human.archer', raceId: 'human', name: '궁수',
    layer: 'ground', role: 'ranged',
    cost: 3, tier: 2,
    baseStats: { hp: 550, atk: 48, attackSpeed: 0.9, moveSpeed: 2.6, range: 4, defense: 6 },
    radius: 0.28, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#6aab6a', emoji: '🏹' },
    eraNames:  ['투척꾼', '궁수', '석궁병', '저격수', '정밀저격수'],
    eraEmojis: ['🪃',     '🏹',   '🎯',     '🔭',     '🔫'],
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 9  },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.08 },
    },
  },

  // ── 3: 방패병 — 중장갑 탱커 ──────────────────────────────────────────
  {
    id: 'human.guardian', raceId: 'human', name: '방패병',
    layer: 'ground', role: 'tank',
    cost: 3, tier: 2,
    baseStats: { hp: 1300, atk: 30, attackSpeed: 0.6, moveSpeed: 2.2, range: 1, defense: 28 },
    radius: 0.35, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#8090a0', emoji: '🪖' },
    eraNames:  ['부족전사', '방패병', '중갑기사', '방어병', '방폭대원'],
    eraEmojis: ['🛡️',       '🪖',     '⚔️',       '🦺',     '🪖'],
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 5  },
      defense:     { cost: 3, maxLevel: 3, addPerLevel: 4  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.06 },
    },
  },

  // ── 4: 기병 — 고속 측면 공격자 ──────────────────────────────────────
  {
    id: 'human.cavalry', raceId: 'human', name: '기마병',
    layer: 'ground', role: 'melee',
    cost: 4, tier: 3,
    baseStats: { hp: 950, atk: 60, attackSpeed: 0.8, moveSpeed: 4.0, range: 1, defense: 12 },
    radius: 0.32, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#c8974a', emoji: '🐴' },
    eraNames:  ['돌격전사', '기마병', '기사단', '기병대', '기갑병'],
    eraEmojis: ['🏃',       '🐴',     '🐎',     '🏇',     '🚗'],
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 10 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 2  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.07 },
    },
  },

  // ── 5: 투석병 — 광역 공성 원거리 ────────────────────────────────────
  {
    id: 'human.catapult', raceId: 'human', name: '투석병',
    layer: 'ground', role: 'ranged',
    cost: 4, tier: 3,
    baseStats: { hp: 600, atk: 70, attackSpeed: 0.5, moveSpeed: 2.0, range: 5, defense: 8 },
    radius: 0.30, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#a85830', emoji: '🪨' },
    eraNames:  ['투척전사',  '투석병', '공성투석병', '박격포병', '포병'],
    eraEmojis: ['💣',        '🪨',     '⚙️',        '💥',       '🚀'],
    research: {
      atk:         { cost: 3, maxLevel: 3, addPerLevel: 12 },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.05 },
    },
  },

  // ── 6: 위생병 — 지원 (ATK 낮음, 추후 치유 어빌리티 예정) ─────────────
  {
    id: 'human.medic', raceId: 'human', name: '치유사',
    layer: 'ground', role: 'ranged',
    cost: 3, tier: 2,
    baseStats: { hp: 650, atk: 15, attackSpeed: 0.8, moveSpeed: 2.6, range: 3, defense: 8 },
    radius: 0.26, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#d8d890', emoji: '💊' },
    eraNames:  ['주술사', '치유사', '수도사', '위생병', '전투의무관'],
    eraEmojis: ['🧙',     '💊',     '✝️',     '⛑️',     '🏥'],
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 4  },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 2  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.07 },
    },
  },

  // ── 7: 전령매/전투기 — 공중 전투 ─────────────────────────────────────
  {
    id: 'human.warbird', raceId: 'human', name: '전투매',
    layer: 'air', role: 'flyer',
    cost: 3, tier: 2,
    baseStats: { hp: 500, atk: 45, attackSpeed: 1.0, moveSpeed: 4.2, range: 2, defense: 6 },
    radius: 0.28, targeting: AIR,
    visual: { shape: 'circle', color: '#507898', emoji: '🦅' },
    eraNames:  ['전령새', '전투매', '전투수리', '전투기', '전폭기'],
    eraEmojis: ['🦅',     '🦅',     '🦅',       '✈️',     '💣'],
    research: {
      atk:         { cost: 2, maxLevel: 3, addPerLevel: 8  },
      defense:     { cost: 2, maxLevel: 3, addPerLevel: 1  },
      attackSpeed: { cost: 2, maxLevel: 3, addPerLevel: 0.09 },
    },
  },
];

// ── 발전 방향 2.1 — 첨단의 길 (에라 ≥ 4 조건) ─────────────────────────
export const HUMAN_ADVANCED_UNITS: UnitDef[] = [
  {
    id: 'human.laserTurret', raceId: 'human', name: '레이저 포탑',
    layer: 'ground', role: 'ranged',
    cost: 5, tier: 3,
    baseStats: { hp: 1200, atk: 90, attackSpeed: 1.4, moveSpeed: 0.2, range: 6, defense: 15 },
    radius: 0.40, targeting: { canHitAir: true, canHitUnderground: false },
    visual: { shape: 'circle', color: '#00c8e8', emoji: '🔧' },
    unlock: { kind: 'devpath', pathId: 'human.advanced' },
  },
  {
    id: 'human.megaMech', raceId: 'human', name: '거대 메크',
    layer: 'ground', role: 'tank',
    cost: 6, tier: 3,
    baseStats: { hp: 3000, atk: 140, attackSpeed: 0.7, moveSpeed: 2.2, range: 2, defense: 40 },
    radius: 0.48, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#989898', emoji: '🤖' },
    unlock: { kind: 'devpath', pathId: 'human.advanced' },
  },
  {
    id: 'human.droneSwarm', raceId: 'human', name: '드론 군집',
    layer: 'air', role: 'flyer',
    cost: 4, tier: 3,
    baseStats: { hp: 900, atk: 60, attackSpeed: 1.6, moveSpeed: 4.5, range: 3, defense: 8 },
    radius: 0.32, targeting: AIR,
    visual: { shape: 'circle', color: '#48d898', emoji: '🚁' },
    unlock: { kind: 'devpath', pathId: 'human.advanced' },
  },
  {
    id: 'human.warVehicle', raceId: 'human', name: '전투 차량',
    layer: 'ground', role: 'melee',
    cost: 5, tier: 3,
    baseStats: { hp: 1700, atk: 100, attackSpeed: 0.9, moveSpeed: 3.2, range: 3, defense: 22 },
    radius: 0.38, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#c8a800', emoji: '🚗' },
    unlock: { kind: 'devpath', pathId: 'human.advanced' },
  },
];

// ── 발전 방향 2.2 — 마법의 길 (에라 ≤ 3 조건) ─────────────────────────
export const HUMAN_MAGIC_UNITS: UnitDef[] = [
  {
    id: 'human.mage', raceId: 'human', name: '마법사',
    layer: 'ground', role: 'ranged',
    cost: 4, tier: 3,
    baseStats: { hp: 600, atk: 95, attackSpeed: 0.7, moveSpeed: 2.2, range: 5, defense: 6 },
    radius: 0.26, targeting: { canHitAir: true, canHitUnderground: false },
    visual: { shape: 'circle', color: '#9870c8', emoji: '🧙' },
    unlock: { kind: 'devpath', pathId: 'human.magic' },
  },
  {
    id: 'human.golem', raceId: 'human', name: '골렘',
    layer: 'ground', role: 'tank',
    cost: 5, tier: 3,
    baseStats: { hp: 2600, atk: 75, attackSpeed: 0.5, moveSpeed: 1.8, range: 1, defense: 38 },
    radius: 0.45, targeting: MELEE_GROUND,
    visual: { shape: 'circle', color: '#b0b0a0', emoji: '🪨' },
    unlock: { kind: 'devpath', pathId: 'human.magic' },
  },
  {
    id: 'human.spirit', raceId: 'human', name: '정령',
    layer: 'air', role: 'flyer',
    cost: 4, tier: 3,
    baseStats: { hp: 800, atk: 70, attackSpeed: 1.0, moveSpeed: 4.0, range: 3, defense: 10 },
    radius: 0.30, targeting: AIR,
    visual: { shape: 'circle', color: '#78bce8', emoji: '✨' },
    unlock: { kind: 'devpath', pathId: 'human.magic' },
  },
  {
    id: 'human.priest', raceId: 'human', name: '사제',
    layer: 'ground', role: 'ranged',
    cost: 3, tier: 2,
    baseStats: { hp: 700, atk: 20, attackSpeed: 0.8, moveSpeed: 2.6, range: 4, defense: 10 },
    radius: 0.26, targeting: RANGED_GROUND,
    visual: { shape: 'circle', color: '#d8c068', emoji: '✝️' },
    unlock: { kind: 'devpath', pathId: 'human.magic' },
  },
];

// 전체 합계
export const HUMAN_UNITS: UnitDef[] = [
  ...HUMAN_BASE_UNITS,
  ...HUMAN_ADVANCED_UNITS,
  ...HUMAN_MAGIC_UNITS,
];
