// 상태이상 및 패시브 어빌리티 처리 모듈
import type { SimUnit, SimState, StatusEffect, Stats } from './types';

// ── 상태이상 틱 감소 + poison 피해 + 만료 제거 ───────────────────────────
export function tickStatusEffects(unit: SimUnit): void {
  unit.statusEffects = unit.statusEffects.filter((se) => {
    // 독: 틱당 maxHp × (value% / 30tps) 피해
    if (se.type === 'poison') {
      const dmg = unit.maxHp * ((se.value ?? 2) / 100) / 30;
      unit.hp = Math.max(0, unit.hp - dmg);
    }
    if (se.remaining === -1) return true; // 영구 (패시브 전용)
    se.remaining--;
    return se.remaining > 0;
  });
}

// ── 상태이상 여부 확인 ────────────────────────────────────────────────────
export function hasStatusEffect(unit: SimUnit, type: string): boolean {
  return unit.statusEffects.some((se) => se.type === type);
}

export const hasFrenzy   = (u: SimUnit) => hasStatusEffect(u, 'frenzy');
export const hasSurfaced = (u: SimUnit) => hasStatusEffect(u, 'surfaced');

// ── 상태이상 추가 (같은 type+tag면 갱신: 더 긴 쪽 유지) ──────────────────
export function applyStatusEffect(unit: SimUnit, effect: StatusEffect): void {
  const existing = unit.statusEffects.find(
    (se) => se.type === effect.type && se.tag === effect.tag,
  );
  if (existing) {
    if (effect.remaining === -1 || effect.remaining > existing.remaining) {
      existing.remaining = effect.remaining;
      if (effect.statBonus) existing.statBonus = effect.statBonus;
      if (effect.statPct)   existing.statPct   = effect.statPct;
      if (effect.value !== undefined) existing.value = effect.value;
    }
  } else {
    unit.statusEffects.push({ ...effect });
  }
}

// ── 패시브: 팩 리더 (늑대 우두머리) ────────────────────────────────────────
// 아군 늑대 ≥3 + packLeader 보유 시 모든 아군 늑대 ATK+20 DEF+3
function processPackLeader(state: SimState): void {
  for (const owner of [0, 1] as const) {
    const wolves = state.units.filter(
      (u) => u.hp > 0 && u.owner === owner && u.defId === 'nature.wolf',
    );
    const hasLeader = wolves.some((w) => w.unlockedAbilities.includes('wolf.packLeader'));
    const conditionMet = hasLeader && wolves.length >= 3;

    for (const wolf of wolves) {
      wolf.statusEffects = wolf.statusEffects.filter((se) => se.tag !== 'packLeader');
      if (conditionMet) {
        wolf.statusEffects.push({
          type: 'statBuff', remaining: 2, tag: 'packLeader',
          statBonus: { atk: 20, defense: 3 },
        });
      }
    }
  }
}

// ── 패시브: 격노 (곰 bear.rage) — HP ≤50% 시 ATK +30% ──────────────────
function processBearRage(state: SimState): void {
  for (const bear of state.units) {
    if (bear.hp <= 0 || bear.defId !== 'nature.bear') continue;
    if (!bear.unlockedAbilities.includes('bear.rage')) continue;
    bear.statusEffects = bear.statusEffects.filter((se) => se.tag !== 'bearRage');
    if (bear.hp / bear.maxHp <= 0.5) {
      bear.statusEffects.push({
        type: 'statBuff', remaining: 2, tag: 'bearRage',
        statPct: { atk: 0.30 },
      });
    }
  }
}

// ── 패시브: 철옹성 (stoneTurtle.fortress) — HP ≤30% 시 DEF ×2 ───────────
function processFortress(state: SimState): void {
  for (const turtle of state.units) {
    if (turtle.hp <= 0 || turtle.defId !== 'nature.stoneTurtle') continue;
    if (!turtle.unlockedAbilities.includes('stoneTurtle.fortress')) continue;
    turtle.statusEffects = turtle.statusEffects.filter((se) => se.tag !== 'fortress');
    if (turtle.hp / turtle.maxHp <= 0.3) {
      turtle.statusEffects.push({
        type: 'statBuff', remaining: 2, tag: 'fortress',
        statPct: { defense: 1.0 }, // +100% = 방어력 ×2
      });
    }
  }
}

// ── 패시브: 집단 공격 (hornets.swarmStrike) — 같은 대상 공격 말벌당 ATK +15% ─
function processSwarmStrike(state: SimState): void {
  for (const owner of [0, 1] as const) {
    const hornets = state.units.filter(
      (u) => u.hp > 0 && u.owner === owner && u.defId === 'nature.hornets',
    );
    if (hornets.length === 0) continue;

    // 각 타겟 ID별 공격하는 말벌 수 계산
    const targetCounts = new Map<number, number>();
    for (const h of hornets) {
      if (h.targetId !== null) {
        targetCounts.set(h.targetId, (targetCounts.get(h.targetId) ?? 0) + 1);
      }
    }

    for (const hornet of hornets) {
      if (!hornet.unlockedAbilities.includes('hornets.swarmStrike')) continue;
      hornet.statusEffects = hornet.statusEffects.filter((se) => se.tag !== 'swarmStrike');
      const count = hornet.targetId !== null ? (targetCounts.get(hornet.targetId) ?? 1) : 1;
      if (count > 1) {
        hornet.statusEffects.push({
          type: 'statBuff', remaining: 2, tag: 'swarmStrike',
          statPct: { atk: (count - 1) * 0.15 }, // 추가 1마리당 +15%
        });
      }
    }
  }
}

// ── 모든 패시브 어빌리티 처리 ──────────────────────────────────────────────
export function processPassives(state: SimState): void {
  processPackLeader(state);
  processBearRage(state);
  processFortress(state);
  processSwarmStrike(state);
}

// ── 스탯 재계산: baseStats + 연장전 배율 + 버프/디버프 ──────────────────────
// 매 틱 호출하여 유닛의 stats를 항상 최신 상태로 유지.
export function recomputeStats(unit: SimUnit, phase: SimState['phase']): void {
  const s: Stats = { ...unit.baseStats };

  // 연장전: ATK×2, AS×2
  if (phase === 'overtime') {
    s.atk         *= 2;
    s.attackSpeed *= 2;
  }

  // 1단계: 절대값 버프/디버프 (statBonus)
  for (const se of unit.statusEffects) {
    if (se.statBonus) {
      for (const [key, val] of Object.entries(se.statBonus)) {
        if (val !== undefined) {
          (s as unknown as Record<string, number>)[key] =
            ((s as unknown as Record<string, number>)[key] ?? 0) + val;
        }
      }
    }
  }

  // 2단계: 비율 버프/디버프 (statPct) — 절대값 적용 이후에 곱함
  for (const se of unit.statusEffects) {
    if (se.statPct) {
      for (const [key, pct] of Object.entries(se.statPct)) {
        if (pct !== undefined) {
          (s as unknown as Record<string, number>)[key] =
            ((s as unknown as Record<string, number>)[key] ?? 0) * (1 + pct);
        }
      }
    }
  }

  // 최솟값 보호
  s.atk         = Math.max(1, s.atk);
  s.defense     = Math.max(0, s.defense);
  s.moveSpeed   = Math.max(0.05, s.moveSpeed);
  s.attackSpeed = Math.max(0.05, s.attackSpeed);

  unit.stats = s;
}
