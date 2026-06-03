// 건물 정의. 수치 수정은 이 파일에서만. (docs/GAME_DESIGN.md §9 기준)

export interface BuildingLevelDef {
  upgradeCost: number;  // 이 레벨로 올리는 코인 비용 (Lv1은 0)
  description: string;  // 해당 레벨 효과 설명
  unitCap?: number;
  maxTier?: number;
  gemsPerTurn?: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  summary: string;       // 건물바 툴팁용 한줄 설명
  requiresUnlock: boolean;
  unlockCost: number;    // requiresUnlock=true일 때 해금 코인
  levels: BuildingLevelDef[]; // index i = Lv(i+1) 상태. levels[0] = Lv1(초기 상태)
}

export const BUILDING_DEFS: Record<string, BuildingDef> = {
  production: {
    id: 'production', name: '생산 시설', icon: '🏭',
    summary: '고급 유닛 티어를 해금합니다',
    requiresUnlock: false, unlockCost: 0,
    levels: [
      { upgradeCost: 0, maxTier: 1, description: '티어 1 유닛 구매 가능' },
      { upgradeCost: 4, maxTier: 2, description: '티어 2 유닛 구매 가능' },
      { upgradeCost: 8, maxTier: 3, description: '모든 티어 구매 가능' },
    ],
  },
  researchLab: {
    id: 'researchLab', name: '연구소', icon: '🔬',
    summary: '매 턴 보석을 생산합니다',
    requiresUnlock: false, unlockCost: 0,
    levels: [
      { upgradeCost: 0,  gemsPerTurn: 2, description: '매 턴 보석 +2' },
      { upgradeCost: 5,  gemsPerTurn: 3, description: '매 턴 보석 +3' },
      { upgradeCost: 10, gemsPerTurn: 4, description: '매 턴 보석 +4' },
    ],
  },
  capacity: {
    id: 'capacity', name: '전투 인원 시설', icon: '⚔️',
    summary: '전투 출전 가능 유닛 수를 늘립니다',
    requiresUnlock: false, unlockCost: 0,
    levels: [
      { upgradeCost: 0, unitCap: 8,  description: '최대 출전 8명' },
      { upgradeCost: 3, unitCap: 10, description: '최대 출전 10명' },
      { upgradeCost: 4, unitCap: 12, description: '최대 출전 12명' },
      { upgradeCost: 5, unitCap: 14, description: '최대 출전 14명' },
      { upgradeCost: 6, unitCap: 16, description: '최대 출전 16명' },
      { upgradeCost: 7, unitCap: 18, description: '최대 출전 18명' },
      { upgradeCost: 8, unitCap: 20, description: '최대 출전 20명 (최대)' },
    ],
  },
  hatchery: {
    id: 'hatchery', name: '부화장', icon: '🥚',
    summary: '유닛 1기 투입 → 1턴 후 능력치 강화된 돌연변이로 부화',
    requiresUnlock: true, unlockCost: 8,
    levels: [
      { upgradeCost: 0, description: '유닛 1기를 투입하면 1턴 후 HP·ATK·DEF +20%의 돌연변이 귀환' },
    ],
  },

  // 인간 종족 전용: 시대 진화 (BuildingPanel에서 별도 렌더)
  eraEvolution: {
    id: 'eraEvolution', name: '시대 진화', icon: '⏫',
    summary: '코인을 지불해 시대를 진화 — 모든 유닛 HP·ATK·DEF 상승',
    requiresUnlock: false, unlockCost: 0,
    levels: [], // 레벨 시스템 미사용 — era 필드로 직접 관리
  },
};

// 종족별 건물 순서 (건물바 표시 순)
export const RACE_BUILDING_IDS: Record<string, string[]> = {
  nature: ['production', 'researchLab', 'capacity', 'hatchery'],
  human:  ['production', 'researchLab', 'capacity', 'eraEvolution'],  // M6
  demon:  ['production', 'researchLab', 'capacity', 'prism'],         // M7
};
