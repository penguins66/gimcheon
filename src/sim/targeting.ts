import type { SimUnit } from './types';

export function dist(a: SimUnit, b: SimUnit): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// GAME_DESIGN §5 레이어·타게팅 규칙
// - 공중(air): 원거리(canHitAir) 또는 공중 유닛만 타겟 가능
// - 지하(underground): 평소 무적. surfaced 상태이거나 canHitUnderground=true인 경우만 타겟 가능
export function canTarget(attacker: SimUnit, target: SimUnit): boolean {
  switch (target.layer) {
    case 'air':
      return attacker.targeting.canHitAir || attacker.layer === 'air';
    case 'underground': {
      const isSurfaced = target.statusEffects.some((se) => se.type === 'surfaced');
      return isSurfaced || attacker.targeting.canHitUnderground;
    }
    default:
      return true; // ground: 누구나 공격 가능
  }
}

// 역할별 타겟 선택
// - 'nearest' (기본): 가장 가까운 유효 적 (거리 동률 = id 작은 쪽, 결정론)
// - 'lowest_hp': 현재 HP가 가장 낮은 유효 적 (암살자)
export function findTarget(unit: SimUnit, units: SimUnit[]): SimUnit | null {
  const valid = units.filter(
    (u) => u.owner !== unit.owner && u.hp > 0 && canTarget(unit, u),
  );
  if (valid.length === 0) return null;

  if (unit.targetPriority === 'lowest_hp') {
    // 암살자: 절대 HP가 가장 낮은 적을 노린다 (동률 = id 작은 쪽)
    return valid.reduce((best, u) =>
      u.hp < best.hp || (u.hp === best.hp && u.id < best.id) ? u : best,
    );
  }

  // 기본: 가장 가까운 적
  let best: SimUnit | null = null;
  let bestDist = Infinity;
  for (const u of valid) {
    const d = dist(unit, u);
    if (d < bestDist || (d === bestDist && best && u.id < best.id)) {
      best = u; bestDist = d;
    }
  }
  return best;
}

// 하위 호환 — Simulation 내부에서 직접 사용하지 않지만 외부 노출용
export function findNearest(unit: SimUnit, units: SimUnit[]): SimUnit | null {
  return findTarget({ ...unit, targetPriority: 'nearest' }, units);
}
