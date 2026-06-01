import type { SimUnit } from './types';
import { CONFIG } from '../config';

const { cols, rows } = CONFIG.grid;

// 원형 충돌 해소: 반경 합보다 가까우면 밀어냄.
// 같은 owner + 같은 stackId = 자연 스택끼리 → 무시.
export function resolveCollisions(units: SimUnit[]): void {
  const alive = units.filter((u) => u.hp > 0);

  for (let iter = 0; iter < 2; iter++) {
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i], b = alive[j];
        if (a.owner === b.owner && a.stackId === b.stackId) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const minD = a.radius + b.radius;

        if (d < minD && d > 0.0001) {
          const push = (minD - d) / 2 / d;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }
    }
  }

  // 그리드 경계 클램프
  for (const u of alive) {
    u.x = Math.max(u.radius, Math.min(cols - u.radius, u.x));
    u.y = Math.max(u.radius, Math.min(rows - u.radius, u.y));
  }
}
