import { CONFIG } from '../config';
import { BUILDING_DEFS } from '../data/buildings';

export interface HatcheryEntry {
  defId:         string;
  mutationLevel: number; // 다음 레벨로 부화된 돌연변이
}

export interface BuildingInstanceState {
  level: number;      // 1부터. requiresUnlock 건물은 0 = 잠김
  unlocked: boolean;
}

export interface PlayerState {
  coins: number;
  gems: number;
  lives: number;
  turn: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  buildings: Record<string, BuildingInstanceState>;
  selectedDevPath: string | null;
  research: Record<string, number>; // nodeId → 현재 레벨 (0 = 미투자)
  hatcherySlot:  HatcheryEntry | null;  // 현재 부화 중인 유닛 (1턴 후 돌연변이로 등장)
  hatcheryQueue: HatcheryEntry[];       // 다음 준비기간에 무료 추가될 돌연변이 목록
  // 파생값 (updateDerived 후 최신 유지)
  unitCap: number;
  maxTier: number;
  gemsPerTurn: number;
}

export function createPlayerState(): PlayerState {
  const s: PlayerState = {
    coins: CONFIG.economy.startCoins,
    gems: 0,
    lives: CONFIG.lives,
    turn: 1,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    buildings: {
      production:  { level: 1, unlocked: true  },
      researchLab: { level: 1, unlocked: true  },
      capacity:    { level: 1, unlocked: true  },
      hatchery:    { level: 0, unlocked: false },
    },
    selectedDevPath: null,
    research: {},
    hatcherySlot:  null,
    hatcheryQueue: [],
    unitCap: CONFIG.capacity.start,
    maxTier: 1,
    gemsPerTurn: CONFIG.research.baseGemsPerTurn,
  };
  updateDerived(s);
  return s;
}

// 건물 레벨로부터 파생 스탯 재계산
export function updateDerived(s: PlayerState): void {
  const prodLv  = s.buildings['production']?.level  ?? 1;
  const labLv   = s.buildings['researchLab']?.level ?? 1;
  const capLv   = s.buildings['capacity']?.level    ?? 1;

  s.maxTier     = BUILDING_DEFS['production'].levels[prodLv - 1]?.maxTier     ?? 1;
  s.gemsPerTurn = BUILDING_DEFS['researchLab'].levels[labLv - 1]?.gemsPerTurn ?? 2;
  s.unitCap     = BUILDING_DEFS['capacity'].levels[capLv - 1]?.unitCap        ?? 8;
}

// 건물 업그레이드/해금 시도. 성공 시 true 반환.
export function upgradeBuilding(s: PlayerState, buildingId: string): boolean {
  const bState = s.buildings[buildingId];
  const bDef   = BUILDING_DEFS[buildingId];
  if (!bState || !bDef) return false;

  if (!bState.unlocked) {
    // 해금 시도
    if (!bDef.requiresUnlock) return false;
    if (s.coins < bDef.unlockCost) return false;
    s.coins -= bDef.unlockCost;
    bState.unlocked = true;
    bState.level = 1;
    updateDerived(s);
    return true;
  }

  // 다음 레벨 업그레이드
  const nextIdx = bState.level; // bState.level은 1-based → nextIdx는 0-based index of next level
  if (nextIdx >= bDef.levels.length) return false; // 이미 최대 레벨
  const cost = bDef.levels[nextIdx].upgradeCost;
  if (s.coins < cost) return false;
  s.coins -= cost;
  bState.level++;
  updateDerived(s);
  return true;
}

export function canUpgrade(s: PlayerState, buildingId: string): boolean {
  const bState = s.buildings[buildingId];
  const bDef   = BUILDING_DEFS[buildingId];
  if (!bState || !bDef) return false;
  if (!bState.unlocked) return s.coins >= bDef.unlockCost;
  const nextIdx = bState.level;
  if (nextIdx >= bDef.levels.length) return false;
  return s.coins >= bDef.levels[nextIdx].upgradeCost;
}

export function upgradeCost(s: PlayerState, buildingId: string): number {
  const bState = s.buildings[buildingId];
  const bDef   = BUILDING_DEFS[buildingId];
  if (!bState || !bDef) return Infinity;
  if (!bState.unlocked) return bDef.unlockCost;
  const nextIdx = bState.level;
  if (nextIdx >= bDef.levels.length) return Infinity;
  return bDef.levels[nextIdx].upgradeCost;
}
