import type { SimState, SimUnit, BattleEffect } from './types';
import { seedRng, nextFloat } from './rng';
import { dist, canTarget, findTarget } from './targeting';
import { applyAttack, calcDamage } from './combat';
import { moveToward } from './movement';
import { resolveCollisions } from './collision';
import {
  tickStatusEffects, processPassives, recomputeStats,
  hasFrenzy, hasSurfaced, applyStatusEffect, hasStatusEffect,
} from './statusEffects';
import { effectiveStats } from '../game/effectiveStats';
import { getUnlockedAbilityIds } from '../game/Research';
import { getUnit } from '../data/units';
import type { Grid } from '../game/Grid';

const DT = 2 / 30; // 게임 속도 2배 (각 틱당 진행량 2×)
const BATTLE_TICKS = 900;   // 30s × 30tps
const OVERTIME_TICKS = 300; // 10s × 30tps

export interface SimPlacement {
  cellId:        number;
  defId:         string;
  mutationLevel?: number; // 부화장 돌연변이 레벨 (없으면 0)
}

export function createSimState(
  p0: SimPlacement[],
  p1: SimPlacement[],
  grid: Grid,
  seed: number,
  p0Research: Record<string, number> = {},
  p1Research: Record<string, number> = {},
): SimState {
  const rng = seedRng(seed);
  const units: SimUnit[] = [];
  let nextId = 0;

  const addPlacements = (
    placements: SimPlacement[],
    owner: 0 | 1,
    research?: Record<string, number>,
  ) => {
    for (const { cellId, defId, mutationLevel = 0 } of placements) {
      const def = getUnit(defId);
      const { col, row } = grid.coord(cellId);
      const stats = effectiveStats(def, research, mutationLevel);
      units.push({
        id: nextId++,
        owner,
        defId,
        layer: def.layer,
        x: col + 0.5,
        y: row + 0.5,
        hp: stats.hp,
        maxHp: stats.hp,
        baseStats: { ...stats },
        stats: { ...stats },
        targeting: { ...def.targeting },
        radius: def.radius,
        targetId: null,
        attackCooldown: nextFloat(rng) * (1 / stats.attackSpeed),
        stackId: cellId * 2 + owner,
        statusEffects: [],
        unlockedAbilities: research ? getUnlockedAbilityIds(def, research) : [],
        targetPriority: def.targetPriority ?? 'nearest',
        attackAnim:      0,
        hitFlash:        0,
        indomitableUsed: false,
      });
    }
  };

  addPlacements(p0, 0, p0Research);
  addPlacements(p1, 1, p1Research); // 2P모드에서는 p1Research도 적용

  return { tick: 0, phase: 'battle', units, effects: [], rng, winner: null };
}

// ── 틱 1회 진행 ───────────────────────────────────────────────────────────
export function tick(state: SimState): void {
  state.tick++;

  // 1. 배틀 시작 어빌리티 (tick 1에만 발동)
  if (state.tick === 1) triggerBattleStartAbilities(state);

  // 2. 조기 승패 체크
  const earlyWinner = checkWinner(state.units);
  if (earlyWinner !== null) {
    state.winner = earlyWinner;
    state.phase = 'done';
    return;
  }

  // 3. 전투→연장전 전환
  if (state.phase === 'battle' && state.tick >= BATTLE_TICKS) {
    enterOvertime(state);
  }

  // 4. 연장전 시간 초과 → HP 합산 승패
  if (state.phase === 'overtime' && state.tick >= BATTLE_TICKS + OVERTIME_TICKS) {
    state.winner = hpWinner(state.units);
    state.phase = 'done';
    return;
  }

  // 5. 이펙트·애니메이션 틱 감소
  state.effects = state.effects.filter((e) => { e.remaining--; return e.remaining > 0; });
  for (const u of state.units) {
    if (u.attackAnim > 0) u.attackAnim--;
    if (u.hitFlash   > 0) u.hitFlash--;
  }

  // 6. 상태이상 틱 감소 + 독 피해 + 패시브 갱신 + 스탯 재계산
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    tickStatusEffects(u);
  }
  processPassives(state);
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    recomputeStats(u, state.phase);
  }

  // 7. 불굴 HP 보호 (0 → 1 복구, 1회 한정)
  for (const u of state.units) {
    if (u.hp <= 0 && !u.indomitableUsed && u.unlockedAbilities.includes('rhino.indomitable')) {
      u.hp = 1;
      u.indomitableUsed = true;
      u.hitFlash = 10;
    }
  }

  // 8. 유닛별 처리 (id 오름차순 — 결정론)
  const sorted = state.units.filter((u) => u.hp > 0).sort((a, b) => a.id - b.id);

  for (const unit of sorted) {
    if (unit.hp <= 0) continue;

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
        const valid = state.units.filter(
          (t) => t.hp > 0 && t.owner !== unit.owner && canTarget(unit, t),
        );
        if (valid.length > 0) {
          unit.targetId = valid[Math.floor(nextFloat(state.rng) * valid.length)]!.id;
        }
      } else {
        unit.targetId = findTarget(unit, state.units)?.id ?? null;
      }
    }
    if (unit.targetId === null) continue;

    const target = findById(state.units, unit.targetId)!;
    const d = dist(unit, target);
    // 표면→표면 거리 기준 사거리 판정
    const surfaceDist = Math.max(0, d - unit.radius - target.radius);
    const inRange = surfaceDist <= unit.stats.range;

    if (inRange && unit.attackCooldown <= 0) {
      // porcupine.spikeArmor: 피격자의 반사 피해 처리 (공격 전 체크)
      triggerOnDefendAbilities(unit, target, state);

      applyAttack(unit, target);
      triggerOnAttackAbilities(unit, target, state);

      // 지하 유닛: 공격 시 1초(30틱) 지상 노출, 이후 자동 잠복 복귀
      if (unit.layer === 'underground') {
        const wasUnderground = !hasSurfaced(unit);
        applyStatusEffect(unit, { type: 'surfaced', remaining: 30 });
        // badger.furyRush: 잠복 해제 직후 이속+공속 ×2 (1초=30틱)
        if (wasUnderground && unit.defId === 'nature.badger' &&
            unit.unlockedAbilities.includes('badger.furyRush')) {
          applyStatusEffect(unit, {
            type: 'statBuff', remaining: 30, tag: 'furyRush',
            statPct: { moveSpeed: 1.0, attackSpeed: 1.0 },
          });
        }
      }

      // 공격 애니메이션 + 피격 플래시
      unit.attackAnim = 6;
      target.hitFlash = 5;

      // 이펙트 생성
      const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
      const effect: BattleEffect = {
        type: unit.stats.range > 1.5 ? 'impact' : 'slash',
        x: target.x, y: target.y, angle,
        remaining: 9, maxDuration: 9,
      };
      state.effects.push(effect);

      // 사망 체크 (공격 직후)
      if (target.hp <= 0) {
        triggerOnDeathAbilities(target, state);
      }
    } else if (!inRange) {
      moveToward(unit, target, DT);
    }
  }

  resolveCollisions(state.units);
}

// ── 배틀 시작 어빌리티 (tick=1에 1회 발동) ──────────────────────────────
function triggerBattleStartAbilities(state: SimState): void {
  const alive = state.units.filter((u) => u.hp > 0);

  for (const unit of alive) {
    // boar.charge: 이동속도 ×3 (2초=60틱)
    if (unit.defId === 'nature.boar' && unit.unlockedAbilities.includes('boar.charge')) {
      applyStatusEffect(unit, {
        type: 'statBuff', remaining: 60, tag: 'charge',
        statPct: { moveSpeed: 2.0 }, // +200% = ×3
      });
    }

    // eagle.divebomb: 무작위 적 1기에 ATK×3 기습
    if (unit.defId === 'nature.eagle' && unit.unlockedAbilities.includes('eagle.divebomb')) {
      const enemies = alive.filter((u) => u.owner !== unit.owner && canTarget(unit, u));
      if (enemies.length > 0) {
        const t = enemies[Math.floor(nextFloat(state.rng) * enemies.length)]!;
        const dmg = calcDamage(unit.stats.atk * 3, t.stats.defense);
        t.hp = Math.max(0, t.hp - dmg);
        t.hitFlash = 10;
        state.effects.push({
          type: 'impact', x: t.x, y: t.y,
          angle: Math.atan2(t.y - unit.y, t.x - unit.x),
          remaining: 14, maxDuration: 14,
        });
        if (t.hp <= 0) triggerOnDeathAbilities(t, state);
      }
    }

    // tyranno.roar: 적 전체 ATK -20% · 이속 -30% (5초=150틱)
    if (unit.defId === 'nature.tyranno' && unit.unlockedAbilities.includes('tyranno.roar')) {
      for (const enemy of alive.filter((u) => u.owner !== unit.owner)) {
        applyStatusEffect(enemy, {
          type: 'statBuff', remaining: 150, tag: 'tyrannoRoar',
          statPct: { atk: -0.20, moveSpeed: -0.30 },
        });
      }
    }

    // mammoth.warcry: 아군 ATK+20·DEF+5 / 적 ATK-20·이속-25% (배틀 내내)
    if (unit.defId === 'nature.mammoth' && unit.unlockedAbilities.includes('mammoth.warcry')) {
      for (const ally of alive.filter((u) => u.owner === unit.owner)) {
        applyStatusEffect(ally, {
          type: 'statBuff', remaining: 9999, tag: 'mammothBuff',
          statBonus: { atk: 20, defense: 5 },
        });
      }
      for (const enemy of alive.filter((u) => u.owner !== unit.owner)) {
        applyStatusEffect(enemy, {
          type: 'statBuff', remaining: 9999, tag: 'mammothDebuff',
          statBonus: { atk: -20 },
          statPct: { moveSpeed: -0.25 },
        });
      }
    }
  }
}

// ── 공격 후 어빌리티 트리거 ───────────────────────────────────────────────
function triggerOnAttackAbilities(
  attacker: SimUnit,
  target: SimUnit,
  state: SimState,
): void {
  const rng = state.rng;

  // 광견병: 30% 확률로 대상에게 광란 (3초=90틱)
  if (attacker.unlockedAbilities.includes('wildDogs.rabies')) {
    if (nextFloat(rng) < 0.30) {
      applyStatusEffect(target, { type: 'frenzy', remaining: 90 });
    }
  }

  // cobra.venomSpit: 50% 확률로 독 (초당 3%, 4초=120틱)
  if (attacker.unlockedAbilities.includes('cobra.venomSpit')) {
    if (nextFloat(rng) < 0.50) {
      applyStatusEffect(target, {
        type: 'poison', remaining: 120, tag: 'cobVenom', value: 3,
      });
    }
  }

  // giantSpider.venom: 항상 독 (초당 2%, 4초=120틱)
  if (attacker.unlockedAbilities.includes('giantSpider.venom')) {
    applyStatusEffect(target, {
      type: 'poison', remaining: 120, tag: 'spiderVenom', value: 2,
    });
  }

  // scorpion.venomStrike: 50% 확률로 독 (초당 2%, 5초=150틱)
  if (attacker.unlockedAbilities.includes('scorpion.venomStrike')) {
    if (nextFloat(rng) < 0.50) {
      applyStatusEffect(target, {
        type: 'poison', remaining: 150, tag: 'scorpVenom', value: 2,
      });
    }
  }

  // moldCrawler.acid: 대상 DEF -50% (3초=90틱)
  if (attacker.unlockedAbilities.includes('moldCrawler.acid')) {
    applyStatusEffect(target, {
      type: 'statBuff', remaining: 90, tag: 'moldAcid',
      statPct: { defense: -0.50 },
    });
  }

  // dragon.breathFire: 10% 확률로 전방 직선 범위 ATK×2 화염 피해
  if (attacker.unlockedAbilities.includes('dragon.breathFire')) {
    if (nextFloat(rng) < 0.10) {
      const angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
      for (const enemy of state.units.filter((u) => u.hp > 0 && u.owner !== attacker.owner)) {
        const ea = Math.atan2(enemy.y - attacker.y, enemy.x - attacker.x);
        let da = Math.abs(angle - ea);
        if (da > Math.PI) da = 2 * Math.PI - da;
        if (da <= Math.PI / 6) { // ±30도 이내
          const dmg = calcDamage(attacker.stats.atk * 2, enemy.stats.defense);
          enemy.hp = Math.max(0, enemy.hp - dmg);
          enemy.hitFlash = 6;
          state.effects.push({
            type: 'impact', x: enemy.x, y: enemy.y,
            angle, remaining: 10, maxDuration: 10,
          });
          if (enemy.hp <= 0) triggerOnDeathAbilities(enemy, state);
        }
      }
    }
  }
}

// ── 피격 시 어빌리티 트리거 (공격자 기준으로 피격자를 전달) ─────────────────
function triggerOnDefendAbilities(
  attacker: SimUnit,
  defender: SimUnit,
  state: SimState,
): void {
  // porcupine.spikeArmor: 피격 시 공격자에게 ATK×25% 반사 피해
  if (defender.unlockedAbilities.includes('porcupine.spikeArmor')) {
    const reflect = defender.stats.atk * 0.25;
    attacker.hp = Math.max(0, attacker.hp - reflect);
    attacker.hitFlash = 4;
    state.effects.push({
      type: 'slash', x: attacker.x, y: attacker.y,
      angle: Math.atan2(attacker.y - defender.y, attacker.x - defender.x),
      remaining: 6, maxDuration: 6,
    });
    if (attacker.hp <= 0) triggerOnDeathAbilities(attacker, state);
  }
}

// ── 사망 시 어빌리티 트리거 ───────────────────────────────────────────────
function triggerOnDeathAbilities(dead: SimUnit, state: SimState): void {
  // deathworm.acidBurst: 주변 2칸 내 적에게 maxHp×30% 산성 피해 (방어력 무시)
  if (dead.defId === 'nature.deathworm' && dead.unlockedAbilities.includes('deathworm.acidBurst')) {
    for (const enemy of state.units.filter((u) => u.hp > 0 && u.owner !== dead.owner)) {
      const d = dist(dead, enemy);
      if (d <= 2.0) {
        const dmg = dead.maxHp * 0.30;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.hitFlash = 8;
        state.effects.push({
          type: 'impact', x: enemy.x, y: enemy.y,
          angle: Math.atan2(enemy.y - dead.y, enemy.x - dead.x),
          remaining: 12, maxDuration: 12,
        });
        // 산성 폭발로 죽은 유닛의 사망 어빌리티도 연쇄 발동
        if (enemy.hp <= 0) triggerOnDeathAbilities(enemy, state);
      }
    }
  }
}

// ── 연장전 전환 ───────────────────────────────────────────────────────────
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
