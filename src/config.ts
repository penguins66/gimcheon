// 전역 밸런스/규칙 상수. 튜닝은 여기 한 곳에서. (docs/GAME_DESIGN.md 기준)

export const CONFIG = {
  // 그리드: 아래 playerRows 행 = 내 진영, 위 = 상대 진영
  grid: { cols: 7, rows: 8, playerRows: 4 },

  // 출전 인원 상한 (전투 인원 증가 시설로 0→max 해금)
  maxUnitCap: 20,
  capacity: { start: 8, perLevel: 2, max: 20 },

  // 배치 칸 용량 기본값 (자연은 발전 후 RaceDef.cellCapacityAfterDevPath 적용)
  cellCapacityDefault: 1,

  // 라운드 타이밍 (M2~M3에서 사용)
  timing: { prepSeconds: 60, battleSeconds: 30, overtimeSeconds: 10 },
  overtime: { atkMultiplier: 2, attackSpeedMultiplier: 2 },

  // 목숨
  lives: 6,

  // 시뮬레이션 (M2)
  sim: { tickRate: 30 },

  // 경제 (M3) — 초기값
  economy: { startCoins: 3, baseIncome: 5, interestPer: 10, interestCap: 5, winBonus: 1 },
  research: { baseGemsPerTurn: 2 },
} as const;
