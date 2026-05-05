import type { ModifierKey } from '../lib/types';
export { rollsToOdds } from '../lib/odds';

export type ZAMode = 'wild' | 'hyperspace' | 'fossil' | 'scan' | 'static';
export type SparklingLevel = 0 | 1 | 2 | 3;

export interface ZAState {
  mode: ZAMode;
  shinyCharm: boolean;
  sparkling: SparklingLevel;
  donutType?: string;
  forcedLv3?: boolean;
}

export const ZA_SOURCES = [
  'https://rotomlabs.net/legends-za-shiny-rates',
  'https://www.ign.com/wikis/pokemon-legends-z-a',
  'https://www.serebii.net/legendsza/shinypokemon.shtml',
];

export const ZA_NOTES = {
  sparklingScope:
    'Sparkling Power applies only inside Hyperspace Wild Zones, only to spawns matching the donut type.',
  forcedLv3:
    'At Sparkling Power Lv. 3, the first nearby spawn matching the boosted type can be forced shiny.',
  fossilCharm:
    'Shiny Charm does NOT add rolls to fossil revivals in Z-A. Fossils stay at base 1/4096.',
  scanExceptions:
    'Special Scan shiny-eligible legendaries: Latios, Latias, Cobalion, Terrakion, Virizion.',
  staticLocked:
    'Starters, scripted battles, gift Pokemon and most legendaries are shiny-locked. Fixed Alpha spawns are not static and remain shiny-eligible.',
};

const CHARM_ROLLS = 3;

export function computeZARolls(state: ZAState): {
  rolls: number;
  modifiersUsed: ModifierKey[];
  caveats: string[];
} {
  const caveats: string[] = [];
  const mods: ModifierKey[] = [];

  if (state.mode === 'static') {
    caveats.push(ZA_NOTES.staticLocked);
    return { rolls: 0, modifiersUsed: [], caveats };
  }

  if (state.mode === 'fossil') {
    caveats.push(ZA_NOTES.fossilCharm);
    return { rolls: 1, modifiersUsed: [], caveats };
  }

  if (state.mode === 'scan') {
    caveats.push(ZA_NOTES.scanExceptions);
    let rolls = 1;
    if (state.shinyCharm) {
      rolls += CHARM_ROLLS;
      mods.push('shinyCharm');
    }
    return { rolls, modifiersUsed: mods, caveats };
  }

  let rolls = 1;
  if (state.shinyCharm) {
    rolls += CHARM_ROLLS;
    mods.push('shinyCharm');
  }

  if (state.mode === 'hyperspace' && state.sparkling > 0) {
    rolls += state.sparkling;
    if (state.sparkling === 1) mods.push('sparkling1');
    if (state.sparkling === 2) mods.push('sparkling2');
    if (state.sparkling === 3) mods.push('sparkling3');
    caveats.push(ZA_NOTES.sparklingScope);
    if (state.sparkling === 3) caveats.push(ZA_NOTES.forcedLv3);
  } else if (state.mode === 'wild' && state.sparkling > 0) {
    caveats.push(
      'Sparkling Power has no effect outside Hyperspace Wild Zones. The boost is being ignored.',
    );
  }

  return { rolls, modifiersUsed: mods, caveats };
}

