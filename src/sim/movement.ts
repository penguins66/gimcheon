import type { SimUnit } from './types';

// 타깃 방향으로 이동.
// stopDist = 공격자·타겟 표면 간격이 사거리(range)가 되는 중심 거리
//   → stopDist = range + attacker.radius + target.radius
// DT는 Simulation.ts의 전역 DT를 인자로 받는다 (movement.ts 자체 DT 제거).
export function moveToward(unit: SimUnit, target: SimUnit, dt: number): void {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return;

  // 표면 간격 기준 정지: 양쪽 반지름을 더한 만큼 여유 있게 멈춤
  const stopDist = unit.stats.range + unit.radius + target.radius;
  const moveAmt  = Math.min(unit.stats.moveSpeed * dt, Math.max(0, d - stopDist));
  if (moveAmt <= 0) return;

  unit.x += (dx / d) * moveAmt;
  unit.y += (dy / d) * moveAmt;
}
