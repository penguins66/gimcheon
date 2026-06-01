// 상태이상 및 패시브 어빌리티 처리 모듈
import type { SimUnit, SimState, StatusEffect, Stats } from './types';

// ── 상태이상 틱 감소 + 만료 제거 ─────────────────────────────────────────
export function tickStatusEffects(unit: SimUnit): void {
  unit.statusEffects = unit.statusEffects.filter((se) => {
    if (se.remaining === -1) return true; // 영구 (패시브 전용)
    se.remaining--;
    return se.remaining > 0;
  });
}

// ── 상태이상 여부 확인 ────────────────────────────────────────────────────
export function hasStatusEffect(unit: SimUnit, type: string): boolean {
  return unit.statusEffects.some((se) => se.type === type);
}

export const hasFrenzy = (u: SimUnit) => hasStatusEffect(u, 'frenzy');

// ── 상태이상 추가 (중복 방지) ──────────────────────────────────────────────
export function applyStatusEffect(unit: SimUnit, effect: StatusEffect): void {
  // 같은 type+tag면 갱신 (더 긴 쪽 유지)
  const existing = unit.statusEffects.find(
    (se) => se.type === effect.type && se.tag === effect.tag,
  );
  if (existing) {
    if (effect.remaining === -1 || effect.remaining > existing.remaining) {
      existing.remaining = effect.remaining;
      if (effect.statBonus) existing.statBonus = effect.statBonus;
    }
  } else {
    unit.statusEffects.push({ ...effect });
  }
}

// ── 패시브: 팩 리더 (늑대 우두머리) ────────────────────────────────────────
// 매 틱 호출: 조건 충족 시 statBuff 갱신, 아니면 제거
function processPackLeader(state: SimState): void {
  for (const owner of [0, 1] as const) {
    const wolves = state.units.filter(
      (u) => u.hp > 0 && u.owner === owner && u.defId === 'nature.wolf',
    );

    // 이 진영에 packLeader 어빌리티 보유한 늑대가 1마리 이상 있는지
    const hasLeader = wolves.some((w) => w.unlockedAbilities.includes('wolf.packLeader'));
    const conditionMet = hasLeader && wolves.length >= 3;

    for (const wolf of wolves) {
      // 기존 packLeader 버프 제거 (매 틱 갱신)
      wolf.statusEffects = wolf.statusEffects.filter((se) => se.tag !== 'packLeader');
      if (conditionMet) {
        // remaining=2: tickStatusEffects 후에도 남아있도록 (1틱 수명으로 갱신)
        wolf.statusEffects.push({
          type: 'statBuff',
          remaining: 2,
          tag: 'packLeader',
          statBonus: { atk: 20, defense: 3 },
        });
      }
    }
  }
}

// ── 모든 패시브 어빌리티 처리 ──────────────────────────────────────────────
export function processPassives(state: SimState): void {
  processPackLeader(state);
}

// ── 스탯 재계산: baseStats + 연장전 배율 + 버프 효과 ──────────────────────
// 매 틱 호출하여 유닛의 stats를 항상 최신 상태로 유지.
export function recomputeStats(unit: SimUnit, phase: SimState['phase']): void {
  const s: Stats = { ...unit.baseStats };

  // 연장전: ATK×2, AS×2
  if (phase === 'overtime') {
    s.atk *= 2;
    s.attackSpeed *= 2;
  }

  // statBuff 상태이상 누적
  for (const se of unit.statusEffects) {
    if (se.type === 'statBuff' && se.statBonus) {
      for (const [key, val] of Object.entries(se.statBonus)) {
        if (val !== undefined) {
          (s as unknown as Record<string, number>)[key] = ((s as unknown as Record<string, number>)[key] ?? 0) + val;
        }
      }
    }
  }

  unit.stats = s;
}
