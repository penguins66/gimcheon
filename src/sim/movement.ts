import type { SimUnit } from './types';

const DT = 1 / 30; // 초/틱

// 타깃 방향으로 이동. 사거리 내에 도달하면 멈춤.
export function moveToward(unit: SimUnit, target: SimUnit): void {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return;

  const stopDist = unit.stats.range; // 사거리 끝에서 정지
  const moveAmt = Math.min(unit.stats.moveSpeed * DT, Math.max(0, d - stopDist));
  if (moveAmt <= 0) return;

  unit.x += (dx / d) * moveAmt;
  unit.y += (dy / d) * moveAmt;
}
