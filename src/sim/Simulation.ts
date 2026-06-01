import type { SimState, SimUnit } from './types';
import { seedRng, nextFloat } from './rng';
import { dist, canTarget, findNearest } from './targeting';
import { applyAttack } from './combat';
import { moveToward } from './movement';
import { resolveCollisions } from './collision';
import {
  tickStatusEffects, processPassives, recomputeStats,
  hasFrenzy, applyStatusEffect,
} from './statusEffects';
import { effectiveStats } from '../game/effectiveStats';
import { getUnlockedAbilityIds } from '../game/Research';
import { getUnit } from '../data/units';
import type { Grid } from '../game/Grid';

const DT = 1 / 30;
const BATTLE_TICKS = 900;   // 30s × 30tps
const OVERTIME_TICKS = 300; // 10s × 30tps

export interface SimPlacement { cellId: number; defId: string }

export function createSimState(
  p0: SimPlacement[],
  p1: SimPlacement[],
  grid: Grid,
  seed: number,
  p0Research: Record<string, number> = {},
): SimState {
  const rng = seedRng(seed);
  const units: SimUnit[] = [];
  let nextId = 0;

  const addPlacements = (
    placements: SimPlacement[],
    owner: 0 | 1,
    research?: Record<string, number>,
  ) => {
    for (const { cellId, defId } of placements) {
      const def = getUnit(defId);
      const { col, row } = grid.coord(cellId);
      const stats = effectiveStats(def, research);
      units.push({
        id: nextId++,
        owner,
        defId,
        layer: def.layer,
        x: col + 0.5,
        y: row + 0.5,
        hp: stats.hp,
        maxHp: stats.hp,
        baseStats: { ...stats },  // 재계산 기준값 (불변)
        stats: { ...stats },      // 현재 틱 실효 스탯
        targeting: { ...def.targeting },
        radius: def.radius,
        targetId: null,
        attackCooldown: nextFloat(rng) * (1 / stats.attackSpeed),
        stackId: cellId * 2 + owner,
        statusEffects: [],
        unlockedAbilities: research ? getUnlockedAbilityIds(def, research) : [],
      });
    }
  };

  addPlacements(p0, 0, p0Research);
  addPlacements(p1, 1); // AI는 연구/어빌리티 없음

  return { tick: 0, phase: 'battle', units, rng, winner: null };
}

// ── 틱 1회 진행 ───────────────────────────────────────────────────────────
export function tick(state: SimState): void {
  state.tick++;

  // 1. 조기 승패 체크
  const earlyWinner = checkWinner(state.units);
  if (earlyWinner !== null) {
    state.winner = earlyWinner;
    state.phase = 'done';
    return;
  }

  // 2. 전투→연장전 전환
  if (state.phase === 'battle' && state.tick >= BATTLE_TICKS) {
    enterOvertime(state);
  }

  // 3. 연장전 시간 초과 → HP 합산 승패
  if (state.phase === 'overtime' && state.tick >= BATTLE_TICKS + OVERTIME_TICKS) {
    state.winner = hpWinner(state.units);
    state.phase = 'done';
    return;
  }

  // 4. 상태이상 틱 감소 + 패시브 갱신 + 스탯 재계산
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    tickStatusEffects(u);
  }
  processPassives(state);
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    recomputeStats(u, state.phase);
  }

  // 5. 유닛별 처리 (id 오름차순 — 결정론)
  const sorted = state.units.filter((u) => u.hp > 0).sort((a, b) => a.id - b.id);

  for (const unit of sorted) {
    if (unit.hp <= 0) continue;

    // 쿨다운 감소
    unit.attackCooldown -= DT;

    // 광란: 매 틱 타겟 초기화 → 무작위 재선택
    if (hasFrenzy(unit)) unit.targetId = null;

    // 타겟 유효성 검증
    if (unit.targetId !== null) {
      const t = findById(state.units, unit.targetId);
      if (!t || t.hp <= 0 || !canTarget(unit, t)) unit.targetId = null;
    }

    // 타겟 탐색
    if (unit.targetId === null) {
      if (hasFrenzy(unit)) {
        // 광란: 무작위 유효 적 선택
        const valid = state.units.filter(
          (t) => t.hp > 0 && t.owner !== unit.owner && canTarget(unit, t),
        );
        if (valid.length > 0) {
          unit.targetId = valid[Math.floor(nextFloat(state.rng) * valid.length)]!.id;
        }
      } else {
        unit.targetId = findNearest(unit, state.units)?.id ?? null;
      }
    }
    if (unit.targetId === null) continue;

    const target = findById(state.units, unit.targetId)!;
    const d = dist(unit, target);
    const inRange = d <= unit.stats.range;

    if (inRange && unit.attackCooldown <= 0) {
      applyAttack(unit, target);
      triggerOnAttackAbilities(unit, target, state);
    } else if (!inRange) {
      moveToward(unit, target);
    }
  }

  resolveCollisions(state.units);
}

// ── 어빌리티 트리거 (공격 후) ────────────────────────────────────────────
function triggerOnAttackAbilities(
  attacker: SimUnit,
  target: SimUnit,
  state: SimState,
): void {
  // 광견병: 30% 확률로 대상에게 광란 상태이상 (90틱 = 3초)
  if (attacker.unlockedAbilities.includes('wildDogs.rabies')) {
    if (nextFloat(state.rng) < 0.30) {
      applyStatusEffect(target, { type: 'frenzy', remaining: 90 });
    }
  }
}

// ── 연장전 전환 ───────────────────────────────────────────────────────────
// stats는 recomputeStats가 매 틱 처리하므로 여기선 쿨다운만 조정
function enterOvertime(state: SimState): void {
  state.phase = 'overtime';
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    u.attackCooldown *= 0.5; // AS가 2배 되므로 쿨다운 절반으로
  }
}

function checkWinner(units: SimUnit[]): 0 | 1 | 'draw' | null {
  const p0 = units.some((u) => u.owner === 0 && u.hp > 0);
  const p1 = units.some((u) => u.owner === 1 && u.hp > 0);
  if (p0 && p1) return null;
  if (!p0 && !p1) return 'draw';
  return p0 ? 0 : 1;
}

function hpWinner(units: SimUnit[]): 0 | 1 | 'draw' {
  const hp0 = units.filter((u) => u.owner === 0).reduce((s, u) => s + u.hp, 0);
  const hp1 = units.filter((u) => u.owner === 1).reduce((s, u) => s + u.hp, 0);
  if (hp0 > hp1) return 0;
  if (hp1 > hp0) return 1;
  return 'draw';
}

function findById(units: SimUnit[], id: number): SimUnit | undefined {
  return units.find((u) => u.id === id);
}

export function timeRemaining(state: SimState): number {
  if (state.phase === 'battle')   return Math.max(0, (BATTLE_TICKS - state.tick) / 30);
  if (state.phase === 'overtime') return Math.max(0, (BATTLE_TICKS + OVERTIME_TICKS - state.tick) / 30);
  return 0;
}
