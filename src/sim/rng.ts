// mulberry32 — 32비트 시드 RNG. 결정론적 재현 보장.
export interface RngState { s: number }

export function seedRng(seed: number): RngState {
  return { s: (seed >>> 0) || 1 };
}

export function nextFloat(rng: RngState): number {
  rng.s = (rng.s + 0x6D2B79F5) >>> 0;
  let t = Math.imul(rng.s ^ (rng.s >>> 15), 1 | rng.s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}

export function nextInt(rng: RngState, n: number): number {
  return Math.floor(nextFloat(rng) * n);
}
