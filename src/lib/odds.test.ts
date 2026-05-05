import { describe, expect, it } from 'vitest';
import { compareOdds, rollsToOdds } from './odds';
import { computeZARolls } from '../data/za';
import { computeSVRolls } from '../data/sv';

describe('rollsToOdds', () => {
  it.each([
    [1, '1/4096.00'],
    [2, '1/2048.00'],
    [3, '1/1365.33'],
    [4, '1/1024.00'],
    [5, '1/819.20'],
    [6, '1/682.67'],
    [7, '1/585.14'],
    [8, '1/512.00'],
  ])('%i rolls -> %s', (rolls, label) => {
    expect(rollsToOdds(rolls).oddsLabel).toBe(label);
  });

  it('returns shiny-locked sentinel for zero rolls', () => {
    const result = rollsToOdds(0);
    expect(result.oddsLabel).toBe('shiny locked');
    expect(result.per1000).toBe(0);
  });

  it('per1000 scales with rolls', () => {
    const a = rollsToOdds(1);
    const b = rollsToOdds(8);
    expect(b.per1000).toBeCloseTo(a.per1000 * 8, 4);
  });
});

describe('compareOdds (better odds first)', () => {
  it('orders 8 rolls before 1 roll', () => {
    const sorted = [rollsToOdds(1), rollsToOdds(8), rollsToOdds(4)].sort(compareOdds);
    expect(sorted.map((o) => o.rolls)).toEqual([8, 4, 1]);
  });
  it('pushes locked entries to the end', () => {
    const sorted = [rollsToOdds(0), rollsToOdds(2), rollsToOdds(0)].sort(compareOdds);
    expect(sorted[0].rolls).toBe(2);
    expect(sorted[2].rolls).toBe(0);
  });
});

describe('Z-A roll computation', () => {
  it('wild base = 1 roll', () => {
    expect(computeZARolls({ mode: 'wild', shinyCharm: false, sparkling: 0 }).rolls).toBe(1);
  });
  it('wild + charm = 4 rolls', () => {
    expect(computeZARolls({ mode: 'wild', shinyCharm: true, sparkling: 0 }).rolls).toBe(4);
  });
  it('hyperspace + sparkling 1 = 2 rolls', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: false, sparkling: 1 }).rolls).toBe(2);
  });
  it('hyperspace + sparkling 2 = 3 rolls', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: false, sparkling: 2 }).rolls).toBe(3);
  });
  it('hyperspace + sparkling 3 = 4 rolls', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: false, sparkling: 3 }).rolls).toBe(4);
  });
  it('charm + sparkling 1 = 5 rolls', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: true, sparkling: 1 }).rolls).toBe(5);
  });
  it('charm + sparkling 2 = 6 rolls', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: true, sparkling: 2 }).rolls).toBe(6);
  });
  it('charm + sparkling 3 = 7 rolls (best non-forced)', () => {
    expect(computeZARolls({ mode: 'hyperspace', shinyCharm: true, sparkling: 3 }).rolls).toBe(7);
  });
  it('fossil ignores Shiny Charm', () => {
    const res = computeZARolls({ mode: 'fossil', shinyCharm: true, sparkling: 3 });
    expect(res.rolls).toBe(1);
    expect(res.caveats.some((c) => c.includes('Shiny Charm does NOT'))).toBe(true);
  });
  it('static = locked (0 rolls)', () => {
    expect(computeZARolls({ mode: 'static', shinyCharm: true, sparkling: 3 }).rolls).toBe(0);
  });
  it('special scan + charm = 4 rolls', () => {
    expect(computeZARolls({ mode: 'scan', shinyCharm: true, sparkling: 0 }).rolls).toBe(4);
  });
  it('wild + sparkling warns that sparkling is ignored outside Hyperspace', () => {
    const res = computeZARolls({ mode: 'wild', shinyCharm: false, sparkling: 3 });
    expect(res.rolls).toBe(1);
    expect(res.caveats.some((c) => c.includes('Sparkling Power has no effect'))).toBe(true);
  });
});

describe('SV roll computation', () => {
  it('base wild = 1 roll', () => {
    expect(
      computeSVRolls({ mode: 'wild', shinyCharm: false, sparkling3: false, outbreak: 0, masuda: false }).rolls,
    ).toBe(1);
  });
  it('charm = 3 rolls', () => {
    expect(
      computeSVRolls({ mode: 'wild', shinyCharm: true, sparkling3: false, outbreak: 0, masuda: false }).rolls,
    ).toBe(3);
  });
  it('outbreak 60 = 3 rolls', () => {
    expect(
      computeSVRolls({ mode: 'outbreak', shinyCharm: false, sparkling3: false, outbreak: 60, masuda: false }).rolls,
    ).toBe(3);
  });
  it('outbreak 60 + charm = 5 rolls', () => {
    expect(
      computeSVRolls({ mode: 'outbreak', shinyCharm: true, sparkling3: false, outbreak: 60, masuda: false }).rolls,
    ).toBe(5);
  });
  it('sparkling 3 = 4 rolls', () => {
    expect(
      computeSVRolls({
        mode: 'sandwich-isolated',
        shinyCharm: false,
        sparkling3: true,
        outbreak: 0,
        masuda: false,
      }).rolls,
    ).toBe(4);
  });
  it('sparkling 3 + charm = 6 rolls', () => {
    expect(
      computeSVRolls({
        mode: 'sandwich-isolated',
        shinyCharm: true,
        sparkling3: true,
        outbreak: 0,
        masuda: false,
      }).rolls,
    ).toBe(6);
  });
  it('best stack (outbreak60 + sparkling3 + charm) = 8 rolls (~1/512)', () => {
    const res = computeSVRolls({
      mode: 'outbreak',
      shinyCharm: true,
      sparkling3: true,
      outbreak: 60,
      masuda: false,
    });
    expect(res.rolls).toBe(8);
    expect(rollsToOdds(res.rolls).oddsLabel).toBe('1/512.00');
  });
  it('breeding base = 1 roll', () => {
    expect(
      computeSVRolls({ mode: 'breeding', shinyCharm: false, sparkling3: false, outbreak: 0, masuda: false }).rolls,
    ).toBe(1);
  });
  it('breeding + charm = 2 rolls (1/2048)', () => {
    expect(
      computeSVRolls({ mode: 'breeding', shinyCharm: true, sparkling3: false, outbreak: 0, masuda: false }).rolls,
    ).toBe(2);
  });
  it('masuda = 6 rolls (~1/683)', () => {
    expect(
      computeSVRolls({ mode: 'breeding', shinyCharm: false, sparkling3: false, outbreak: 0, masuda: true }).rolls,
    ).toBe(6);
  });
  it('masuda + charm = 8 rolls (1/512)', () => {
    expect(
      computeSVRolls({ mode: 'breeding', shinyCharm: true, sparkling3: false, outbreak: 0, masuda: true }).rolls,
    ).toBe(8);
  });
  it('breeding + sparkling3 warns that sandwich does not affect eggs', () => {
    const res = computeSVRolls({
      mode: 'breeding',
      shinyCharm: false,
      sparkling3: true,
      outbreak: 0,
      masuda: false,
    });
    expect(res.caveats.some((c) => c.includes('does NOT apply to eggs'))).toBe(true);
  });
});
