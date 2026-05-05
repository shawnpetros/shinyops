import type { ModifierKey, PokeType, SVRecipe } from '../lib/types';
export { rollsToOdds } from '../lib/odds';

export type SVMode = 'wild' | 'outbreak' | 'sandwich-isolated' | 'breeding';
export type OutbreakCount = 0 | 30 | 60;

export interface SVState {
  mode: SVMode;
  shinyCharm: boolean;
  sparkling3: boolean;
  sandwichType?: PokeType;
  outbreak: OutbreakCount;
  masuda: boolean;
}

export const SV_SOURCES = [
  'https://www.serebii.net/scarletviolet/shinypokemon.shtml',
  'https://www.ign.com/wikis/pokemon-scarlet-violet',
  'https://game8.co/games/Pokemon-Scarlet-Violet/archives/391938',
];

export const SV_NOTES = {
  sandwichWildOnly: 'Sparkling Power affects wild encounters only. It does NOT apply to eggs.',
  durationMin: 'Sandwich meal powers last 30 minutes. Plan your route before biting in.',
  bestStack:
    'Best wild stack: Outbreak 60+ cleared + Sparkling Power Lv. 3 + Shiny Charm = ~1/512.',
  letsGo:
    'Let’s Go mode does not auto-attack shiny Pokemon, useful for spotting subtle shinies.',
  masudaImpliesForeign:
    'Masuda requires breeding parents from games of different real-world languages.',
  encounterPower:
    'For sandwich-isolated hunts, also pick an Encounter Power for the target type so spawns concentrate.',
};

export function computeSVRolls(state: SVState): {
  rolls: number;
  modifiersUsed: ModifierKey[];
  caveats: string[];
} {
  const caveats: string[] = [];
  const mods: ModifierKey[] = [];

  if (state.mode === 'breeding') {
    if (state.masuda) {
      caveats.push(SV_NOTES.masudaImpliesForeign);
      const rolls = state.shinyCharm ? 8 : 6;
      mods.push('masuda');
      if (state.shinyCharm) mods.push('shinyCharm');
      return { rolls, modifiersUsed: mods, caveats };
    }
    const rolls = state.shinyCharm ? 2 : 1;
    if (state.shinyCharm) mods.push('shinyCharm');
    if (state.sparkling3) caveats.push(SV_NOTES.sandwichWildOnly);
    return { rolls, modifiersUsed: mods, caveats };
  }

  let rolls = 1;
  if (state.shinyCharm) {
    rolls += 2;
    mods.push('shinyCharm');
  }
  if (state.sparkling3) {
    rolls += 3;
    mods.push('sparkling3');
    caveats.push(SV_NOTES.durationMin);
  }
  if (state.outbreak >= 60) {
    rolls += 2;
    mods.push('outbreak60');
  } else if (state.outbreak >= 30) {
    rolls += 1;
    mods.push('outbreak30');
  }

  if (state.mode === 'sandwich-isolated' && !state.sparkling3) {
    caveats.push('Sandwich-isolated mode without Sparkling Lv. 3 is just base wild.');
  }
  if (state.mode === 'sandwich-isolated' && state.sparkling3) {
    caveats.push(SV_NOTES.encounterPower);
  }
  if (state.mode === 'outbreak' && state.outbreak < 30) {
    caveats.push('Mass Outbreak boost requires at least 30 cleared. 60+ is the full bonus.');
  }

  return { rolls, modifiersUsed: mods, caveats };
}


export const svRecipes: SVRecipe[] = [
  { type: 'normal', primary: 'Tofu', flavor: 'Salty + Sour', durationMin: 30, source: 'Game8' },
  { type: 'fighting', primary: 'Pickle', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'flying', primary: 'Prosciutto', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'poison', primary: 'Green Bell Pepper', flavor: 'Salty + Spicy', durationMin: 30, source: 'Game8' },
  { type: 'ground', primary: 'Ham', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'rock', primary: 'Bacon', flavor: 'Salty + Sour', durationMin: 30, source: 'Game8' },
  { type: 'bug', primary: 'Cherry Tomatoes', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'ghost', primary: 'Red Onion', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'steel', primary: 'Hamburger', flavor: 'Salty + Sweet', durationMin: 30, source: 'Game8' },
  { type: 'fire', primary: 'Red Bell Pepper', flavor: 'Salty + Spicy', durationMin: 30, source: 'Game8' },
  { type: 'water', primary: 'Cucumber', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'grass', primary: 'Lettuce', flavor: 'Salty + Sour', durationMin: 30, source: 'Game8' },
  { type: 'electric', primary: 'Yellow Bell Pepper', flavor: 'Salty + Spicy', durationMin: 30, source: 'Game8' },
  { type: 'psychic', primary: 'Onion', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'ice', primary: 'Klawf Stick', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'dragon', primary: 'Avocado', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
  { type: 'dark', primary: 'Smoked Fillet', flavor: 'Salty + Sweet', durationMin: 30, source: 'Game8' },
  { type: 'fairy', primary: 'Tomato', flavor: 'Salty x2', durationMin: 30, source: 'Game8' },
];

export const recipeByType = Object.fromEntries(
  svRecipes.map((r) => [r.type, r]),
) as Record<PokeType, SVRecipe>;
