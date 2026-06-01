// 연구 시스템 — 보석으로 스탯 노드 투자 + 어빌리티 해금
import type { PlayerState } from './PlayerState';
import type { UnitDef, ResearchStatDef, AbilityResearchNode } from '../sim/types';

// ── 노드 ID 헬퍼 ──────────────────────────────────────────────────────────
// playerState.research 키 형식: '{unitId}.atk' | '{unitId}.defense' | '{unitId}.attackSpeed' | '{unitId}.ability'
export type ResearchStatKey = 'atk' | 'defense' | 'attackSpeed';

export function statNodeId(unitId: string, stat: ResearchStatKey): string {
  return `${unitId}.${stat}`;
}
export function abilityNodeId(unitId: string): string {
  return `${unitId}.ability`;
}

// ── 총합 레벨 ─────────────────────────────────────────────────────────────
export function getTotalStatLevel(unitId: string, research: Record<string, number>): number {
  return (research[statNodeId(unitId, 'atk')]          ?? 0)
       + (research[statNodeId(unitId, 'defense')]       ?? 0)
       + (research[statNodeId(unitId, 'attackSpeed')]   ?? 0);
}

// ── 스탯 노드 투자 가능 여부 ──────────────────────────────────────────────
export function canInvestStat(
  s: PlayerState,
  unitId: string,
  stat: ResearchStatKey,
  nodeDef: ResearchStatDef,
): boolean {
  const current = s.research[statNodeId(unitId, stat)] ?? 0;
  if (current >= nodeDef.maxLevel) return false;
  return s.gems >= nodeDef.cost;
}

// 스탯 노드 투자 (성공 시 true)
export function investStat(
  s: PlayerState,
  unitId: string,
  stat: ResearchStatKey,
  nodeDef: ResearchStatDef,
): boolean {
  if (!canInvestStat(s, unitId, stat, nodeDef)) return false;
  s.gems -= nodeDef.cost;
  const key = statNodeId(unitId, stat);
  s.research[key] = (s.research[key] ?? 0) + 1;
  return true;
}

// ── 어빌리티 해금 가능 여부 ───────────────────────────────────────────────
export function canUnlockAbility(
  s: PlayerState,
  unitId: string,
  abilityNode: AbilityResearchNode,
): boolean {
  if ((s.research[abilityNodeId(unitId)] ?? 0) >= 1) return false; // 이미 해금
  const total = getTotalStatLevel(unitId, s.research);
  if (total < abilityNode.requiresTotalLevel) return false;
  return s.gems >= abilityNode.cost;
}

// 어빌리티 해금 (성공 시 true)
export function unlockAbility(
  s: PlayerState,
  unitId: string,
  abilityNode: AbilityResearchNode,
): boolean {
  if (!canUnlockAbility(s, unitId, abilityNode)) return false;
  s.gems -= abilityNode.cost;
  s.research[abilityNodeId(unitId)] = 1;
  return true;
}

// ── 어빌리티 해금 여부 확인 ───────────────────────────────────────────────
export function isAbilityUnlocked(s: PlayerState, unitId: string): boolean {
  return (s.research[abilityNodeId(unitId)] ?? 0) >= 1;
}

// ── 플레이어 연구 기반으로 유닛의 해금된 어빌리티 ID 목록 반환 ─────────────
export function getUnlockedAbilityIds(unit: UnitDef, research: Record<string, number>): string[] {
  if (!unit.research?.ability) return [];
  const abilityLv = research[abilityNodeId(unit.id)] ?? 0;
  if (abilityLv < 1) return [];
  return [unit.research.ability.abilityId];
}
