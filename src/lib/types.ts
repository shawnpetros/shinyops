export type GameId =
  | 'sv'
  | 'za'
  | 'la'
  | 'bdsp'
  | 'sw'
  | 'sh';

export type Era = 'gen6' | 'gen7' | 'gen8' | 'gen8.5' | 'gen9';
export type Platform = 'switch' | '3ds' | 'ds';

export type PokeType =
  | 'normal' | 'fighting' | 'flying' | 'poison' | 'ground'
  | 'rock' | 'bug' | 'ghost' | 'steel' | 'fire'
  | 'water' | 'grass' | 'electric' | 'psychic' | 'ice'
  | 'dragon' | 'dark' | 'fairy';

export type Mechanic =
  | 'shinyCharm'
  | 'masuda'
  | 'breeding'
  | 'sandwich'
  | 'donut'
  | 'massOutbreak'
  | 'specialScan'
  | 'fossil'
  | 'wild';

export type CategoryId =
  | 'base'
  | 'charm'
  | 'chain'
  | 'sandwich'
  | 'donut'
  | 'outbreak'
  | 'masuda'
  | 'za-specific'
  | 'locked';

export interface Category {
  id: CategoryId;
  emoji: string;
  label: string;
  description: string;
  colorVar: string;
}

export interface Game {
  id: GameId;
  name: string;
  shortName: string;
  era: Era;
  platform: Platform;
  supportedMechanics: Mechanic[];
  releaseYear: number;
}

export type ModifierKey =
  | 'shinyCharm'
  | 'sparkling1'
  | 'sparkling2'
  | 'sparkling3'
  | 'outbreak30'
  | 'outbreak60'
  | 'masuda'
  | 'donutMatch'
  | 'forcedShinyLv3';

export type HuntType = 'wild' | 'breed' | 'fossil' | 'scan' | 'static';

export interface Method {
  id: string;
  gameId: GameId;
  name: string;
  huntType: HuntType;
  categories: CategoryId[];
  rolls: number;
  denominator: number;
  modifiers: ModifierKey[];
  appliesToTypes?: PokeType[];
  notes?: string;
  sources: string[];
}

export type SpeciesStatus = 'needed' | 'hunting' | 'caught' | 'locked';

export interface SpeciesAvailability {
  catchable: boolean;
  locked?: boolean;
  // True when the species exists in this game only via HOME transfer (or
  // similar import path), not in any wild encounter table. Gates which
  // methods apply: breeding methods (Masuda) work on transferred Pokémon,
  // outbreak / sandwich / overworld methods do not.
  transferOnly?: boolean;
  notes?: string;
}

export interface SpeciesSprites {
  default?: string;
  shiny?: string;
  artwork?: string;
  artworkShiny?: string;
}

export interface Species {
  id: string;
  dexNumber: number;
  name: string;
  types: PokeType[];
  sprites?: SpeciesSprites;
  availabilityByGame: Partial<Record<GameId, SpeciesAvailability>>;
}

export interface SVRecipe {
  type: PokeType;
  primary: string;
  flavor: string;
  durationMin: number;
  source: string;
}

export interface OddsResult {
  rolls: number;
  denominator: number;
  oddsLabel: string;
  per1000: number;
}

export interface TrackerEntry {
  status: SpeciesStatus;
  gameId?: GameId;
  notes?: string;
  updated: string;
}

export type TrackerState = Record<string, TrackerEntry>;
