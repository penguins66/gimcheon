// 콘텐츠 + 시뮬레이션 공용 타입 (docs/ARCHITECTURE.md §4 데이터 스키마)

export type RaceId = 'nature' | 'human' | 'demon';
export type Layer = 'ground' | 'air' | 'underground';

export interface Stats {
  hp: number;
  atk: number;
  attackSpeed: number; // 초당 공격 수
  moveSpeed: number;   // 칸/초
  range: number;       // 칸
  defense: number;     // 아머 포인트
}

export interface TargetingFlags {
  canHitAir: boolean;
  canHitUnderground: boolean;
}

export interface VisualDef {
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  emoji?: string;
  sprite?: string;
}

export type UnlockCondition =
  | { kind: 'devpath'; pathId: string }
  | { kind: 'era'; min?: number; max?: number }
  | { kind: 'summon'; from: { unitId: string; count: number }[] };

// ── 연구 트리 타입 ─────────────────────────────────────────────────────────
// 스탯 노드: 이름 없이 "공격력/방어력/공격속도 Lv.X" 로만 표시
export interface ResearchStatDef {
  cost: number;        // 💎 per level
  maxLevel: number;    // 보통 3
  addPerLevel: number; // 레벨당 스탯 증가량
}

// 어빌리티 해금 노드: 스탯 노드 총합 레벨 임계치 달성 시 해금 가능
export interface AbilityResearchNode {
  abilityId: string;
  name: string;
  description: string;
  cost: number;                // 💎 해금 비용
  requiresTotalLevel: number;  // atk+def+as 총합 이상이어야 해금 가능
}

// 유닛 연구 트리 (스탯 3개 고정 + 어빌리티 선택)
export interface ResearchTreeDef {
  atk:         ResearchStatDef;
  defense:     ResearchStatDef;
  attackSpeed: ResearchStatDef;
  ability?:    AbilityResearchNode;
}

// ── 상태이상 ───────────────────────────────────────────────────────────────
export type StatusEffectType = 'frenzy' | 'statBuff';

export interface StatusEffect {
  type:       StatusEffectType;
  remaining:  number;           // 남은 틱 수. -1 = 패시브 (별도 제거 필요)
  tag?:       string;           // 패시브 식별자 (예: 'packLeader')
  statBonus?: Partial<Stats>;   // statBuff 전용
}

// ── 유닛 정의 ─────────────────────────────────────────────────────────────
export interface UnitDef {
  id: string;
  raceId: RaceId;
  name: string;
  layer: Layer;
  cost: number;
  tier: number;
  baseStats: Stats;
  radius: number;
  targeting: TargetingFlags;
  research?: ResearchTreeDef;
  visual: VisualDef;
  unlock?: UnlockCondition;
}

// ── 건물 ──────────────────────────────────────────────────────────────────
export interface BuildingLevel {
  upgradeCost: number;
  effects: Record<string, number>;
}

export interface BuildingDef {
  id: string;
  name: string;
}

export interface DevPathDef {
  id: string;
  raceId: RaceId;
  name: string;
  unlockTurn: number;
  condition?: UnlockCondition;
  unitsUnlocked: string[];
}

export interface RaceDef {
  id: RaceId;
  name: string;
  baseUnitIds: string[];
  buildingIds: string[];
  devPaths: [DevPathDef, DevPathDef];
  mechanic: 'hatchery' | 'era' | 'prism';
  cellCapacity: number;
  cellCapacityAfterDevPath?: number;
}

// ── 시뮬레이션 런타임 타입 ──────────────────────────────────────────────────
import type { RngState } from './rng';
export type { RngState };

export interface SimState {
  tick: number;
  phase: 'battle' | 'overtime' | 'done';
  units: SimUnit[];
  rng: RngState;
  winner: 0 | 1 | 'draw' | null;
}

export interface SimUnit {
  id: number;
  owner: 0 | 1;
  defId: string;
  layer: Layer;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  baseStats: Stats;              // 전투 시작 실효 스탯 (연장전/버프 재계산 기준)
  stats: Stats;                  // 현재 틱 실효 스탯
  targeting: TargetingFlags;
  radius: number;
  targetId: number | null;
  attackCooldown: number;
  stackId: number;
  statusEffects: StatusEffect[];  // 현재 상태이상 목록
  unlockedAbilities: string[];    // 해금된 어빌리티 ID 목록
}
