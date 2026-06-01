import { CONFIG } from '../config';
import type { PlayerState } from './PlayerState';

export interface IncomeBreakdown {
  base: number;
  interest: number;
  winLossBonus: number;
  streakBonus: number;
  gemIncome: number;
  totalCoins: number;
}

// GAME_DESIGN §7 정산 공식
export function calcIncome(s: PlayerState, won: boolean, isDraw: boolean): IncomeBreakdown {
  const base = CONFIG.economy.baseIncome; // 5

  const interest = Math.min(
    CONFIG.economy.interestCap,
    Math.floor(s.coins / CONFIG.economy.interestPer),
  );

  const winLossBonus = isDraw ? 0 : CONFIG.economy.winBonus; // 무승부=0, 승/패=+1

  const streak = won
    ? s.consecutiveWins
    : isDraw
      ? 0
      : s.consecutiveLosses;
  const streakBonus = streak >= 6 ? 3 : streak >= 4 ? 2 : streak >= 2 ? 1 : 0;

  return {
    base,
    interest,
    winLossBonus,
    streakBonus,
    gemIncome: s.gemsPerTurn,
    totalCoins: base + interest + winLossBonus + streakBonus,
  };
}

// 정산 결과를 PlayerState에 반영
export function applySettlement(
  s: PlayerState,
  breakdown: IncomeBreakdown,
  won: boolean,
  isDraw: boolean,
): void {
  s.coins += breakdown.totalCoins;
  s.gems  += breakdown.gemIncome;

  if (!isDraw) {
    if (won) {
      s.consecutiveWins++;
      s.consecutiveLosses = 0;
    } else {
      s.consecutiveLosses++;
      s.consecutiveWins = 0;
      s.lives = Math.max(0, s.lives - 1);
    }
  }

  s.turn++;
}
