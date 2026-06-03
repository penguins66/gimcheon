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
// surfaced: 지하 유닛이 공격 시 2초간 지상 노출 (타겟 가능 상태)
// poison  : 매 틱 maxHp% 감소 (value = 초당 % 피해량)
export type StatusEffectType = 'frenzy' | 'statBuff' | 'surfaced' | 'poison';

export interface StatusEffect {
  type:       StatusEffectType;
  remaining:  number;           // 남은 틱 수. -1 = 패시브 (별도 제거 필요)
  tag?:       string;           // 식별자 (중복 방지·갱신용)
  statBonus?: Partial<Stats>;   // 절대값 버프/디버프
  statPct?:   Partial<Stats>;   // 비율 버프/디버프 (-0.20 = -20%)
  value?:     number;           // poison: 초당 HP% 피해
}

// ── 유닛 역할 / 타겟 우선순위 ─────────────────────────────────────────────
// role: ShopPanel 등 UI 표시용. targetPriority: 시뮬레이션 타겟 선택에 영향
export type UnitRole = 'tank' | 'melee' | 'assassin' | 'ranged' | 'flyer' | 'underground';
export type TargetPriority = 'nearest' | 'lowest_hp';

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
  role?: UnitRole;
  targetPriority?: TargetPriority; // 기본: 'nearest'
  research?: ResearchTreeDef;
  visual: VisualDef;
  unlock?: UnlockCondition;
  // 인간 종족 시대별 유닛명·이모지 (선사→철기→중세→근대→현대, 길이 5)
  eraNames?:  string[];
  eraEmojis?: string[];
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

// ── 전투 이펙트 ───────────────────────────────────────────────────────────
export type EffectType = 'slash' | 'impact';

export interface BattleEffect {
  type: EffectType;
  x: number;            // 월드 좌표
  y: number;
  angle: number;        // 라디안
  remaining: number;    // 남은 틱
  maxDuration: number;  // 총 지속 틱
}

export interface SimState {
  tick: number;
  phase: 'battle' | 'overtime' | 'done';
  units: SimUnit[];
  effects: BattleEffect[];
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
  targetPriority: TargetPriority; // 타겟 선택 우선순위
  attackAnim:      number;  // 공격 돌진 애니메이션 남은 틱 (0 = 정지)
  hitFlash:        number;  // 피격 붉은 깜빡임 남은 틱 (0 = 정상)
  indomitableUsed: boolean; // 불굴 어빌리티 발동 여부 (1회만)
}
