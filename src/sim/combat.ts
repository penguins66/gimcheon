import type { SimUnit } from './types';

// GAME_DESIGN §6: 데미지 = ATK × 100 / (100 + DEF), 최소 1
export function calcDamage(atk: number, def: number): number {
  return Math.max(1, (atk * 100) / (100 + def));
}

export function applyAttack(attacker: SimUnit, target: SimUnit): void {
  const dmg = calcDamage(attacker.stats.atk, target.stats.defense);
  target.hp = Math.max(0, target.hp - dmg);
  attacker.attackCooldown = 1 / attacker.stats.attackSpeed;
}
