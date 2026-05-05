import type { OddsResult } from './types';

export const DEFAULT_DENOMINATOR = 4096;

export function rollsToOdds(rolls: number, denominator = DEFAULT_DENOMINATOR): OddsResult {
  if (rolls <= 0) {
    return {
      rolls: 0,
      denominator,
      oddsLabel: 'shiny locked',
      per1000: 0,
    };
  }
  const per1000 = (rolls / denominator) * 1000;
  const value = denominator / rolls;
  return {
    rolls,
    denominator,
    oddsLabel: `1/${value.toFixed(2)}`,
    per1000,
  };
}

export function compareOdds(a: OddsResult, b: OddsResult): number {
  if (a.rolls === 0 && b.rolls === 0) return 0;
  if (a.rolls === 0) return 1;
  if (b.rolls === 0) return -1;
  return b.rolls / b.denominator - a.rolls / a.denominator;
}
