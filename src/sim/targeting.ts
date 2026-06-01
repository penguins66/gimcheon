import type { SimUnit } from './types';

export function dist(a: SimUnit, b: SimUnit): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// GAME_DESIGN §5 레이어·타게팅 규칙
export function canTarget(attacker: SimUnit, target: SimUnit): boolean {
  switch (target.layer) {
    case 'air':
      return attacker.targeting.canHitAir || attacker.layer === 'air';
    case 'underground':
      return attacker.targeting.canHitUnderground;
    default:
      return true; // ground: 누구나 공격 가능
  }
}

// 가장 가까운 유효 적 반환. 거리 동률 = id 작은 쪽 우선 (결정론)
export function findNearest(unit: SimUnit, units: SimUnit[]): SimUnit | null {
  let best: SimUnit | null = null;
  let bestDist = Infinity;
  for (const u of units) {
    if (u.owner === unit.owner || u.hp <= 0) continue;
    if (!canTarget(unit, u)) continue;
    const d = dist(unit, u);
    if (d < bestDist || (d === bestDist && best && u.id < best.id)) {
      best = u; bestDist = d;
    }
  }
  return best;
}
