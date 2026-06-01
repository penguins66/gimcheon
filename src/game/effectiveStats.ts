import type { Stats, UnitDef } from '../sim/types';
import { statNodeId } from './Research';

// 실효 스탯 산출: 기본 스탯 + 연구(M4) + 시대 진화(M6) + 군단장 강화(M7).
// research: playerState.research ('{unitId}.stat' → 현재 레벨). 없으면 기본값만 반환.
export function effectiveStats(def: UnitDef, research?: Record<string, number>): Stats {
  const s: Stats = { ...def.baseStats };

  if (research && def.research) {
    const tree = def.research;

    // 공격력 노드
    const atkLv = research[statNodeId(def.id, 'atk')] ?? 0;
    if (atkLv > 0) s.atk += tree.atk.addPerLevel * atkLv;

    // 방어력 노드
    const defLv = research[statNodeId(def.id, 'defense')] ?? 0;
    if (defLv > 0) s.defense += tree.defense.addPerLevel * defLv;

    // 공격속도 노드
    const asLv = research[statNodeId(def.id, 'attackSpeed')] ?? 0;
    if (asLv > 0) s.attackSpeed += tree.attackSpeed.addPerLevel * asLv;
    // 어빌리티(unlockAbility)는 시뮬레이션 내 ability 시스템에서 별도 처리
  }

  return s;
}
