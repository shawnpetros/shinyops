import type { Species, SpeciesAvailability, SpeciesSprites, GameId, PokeType } from '../lib/types';
import { generatedPokemon } from './generated/pokemon';

interface CuratedSpecies {
  id: string;
  dexNumber?: number;
  name?: string;
  types?: PokeType[];
  sprites?: SpeciesSprites;
  availabilityByGame: Partial<Record<GameId, SpeciesAvailability>>;
}

const curated: CuratedSpecies[] = [
  {
    id: 'pikachu',
    availabilityByGame: {
      sv: { catchable: true },
      za: { catchable: true },
      sw: { catchable: true },
      sh: { catchable: true },
    },
  },
  {
    id: 'charmander',
    availabilityByGame: {
      za: { catchable: true, locked: true, notes: 'Mega Stone gift Pokemon, shiny locked.' },
      sv: { catchable: true },
    },
  },
  {
    id: 'chikorita',
    availabilityByGame: {
      za: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'totodile',
    availabilityByGame: {
      za: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'tepig',
    availabilityByGame: {
      za: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'latios',
    availabilityByGame: {
      za: { catchable: true, notes: 'Special Scan; shiny eligible despite legendary status.' },
    },
  },
  {
    id: 'latias',
    availabilityByGame: {
      za: { catchable: true, notes: 'Special Scan; shiny eligible despite legendary status.' },
    },
  },
  {
    id: 'cobalion',
    availabilityByGame: {
      za: { catchable: true, notes: 'Special Scan; shiny eligible.' },
    },
  },
  {
    id: 'terrakion',
    availabilityByGame: {
      za: { catchable: true, notes: 'Special Scan; shiny eligible.' },
    },
  },
  {
    id: 'virizion',
    availabilityByGame: {
      za: { catchable: true, notes: 'Special Scan; shiny eligible.' },
    },
  },
  {
    id: 'aerodactyl',
    availabilityByGame: {
      za: { catchable: true, notes: 'Old Amber fossil revival; charm does not apply.' },
    },
  },
  {
    id: 'kabuto',
    availabilityByGame: {
      za: { catchable: true, notes: 'Dome Fossil revival; charm does not apply.' },
    },
  },
  {
    id: 'omanyte',
    availabilityByGame: {
      za: { catchable: true, notes: 'Helix Fossil revival; charm does not apply.' },
    },
  },
  {
    id: 'sprigatito',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'fuecoco',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'quaxly',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Starter; shiny locked.' },
    },
  },
  {
    id: 'eevee',
    availabilityByGame: {
      sv: { catchable: true },
      sw: { catchable: true },
      sh: { catchable: true },
      bdsp: { catchable: true },
    },
  },
  {
    id: 'lechonk',
    availabilityByGame: {
      sv: { catchable: true, notes: 'Common outbreak target.' },
    },
  },
  {
    id: 'tinkatink',
    availabilityByGame: {
      sv: { catchable: true },
    },
  },
  {
    id: 'frigibax',
    availabilityByGame: {
      sv: { catchable: true, notes: 'Outbreak-friendly target for shiny Baxcalibur hunts.' },
    },
  },
  {
    id: 'koraidon',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Box legendary; shiny locked.' },
    },
  },
  {
    id: 'miraidon',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Box legendary; shiny locked.' },
    },
  },
  {
    id: 'mew',
    dexNumber: 151,
    name: 'Mew',
    types: ['psychic'],
    availabilityByGame: {
      za: { catchable: true, locked: true, notes: 'Mythical; shiny locked.' },
      sv: { catchable: true, locked: true, notes: 'Mythical; shiny locked.' },
    },
  },
  {
    id: 'gimmighoul',
    availabilityByGame: {
      sv: { catchable: true },
    },
  },
  {
    id: 'shroodle',
    availabilityByGame: {
      sv: { catchable: true },
    },
  },
  {
    id: 'gible',
    availabilityByGame: {
      sv: { catchable: true, notes: 'Tera Raid + outbreak; classic farm target.' },
      bdsp: { catchable: true },
    },
  },
  {
    id: 'larvitar',
    availabilityByGame: {
      sv: { catchable: true },
      sw: { catchable: true },
      sh: { catchable: true },
    },
  },
  {
    id: 'ralts',
    availabilityByGame: {
      sv: { catchable: true },
      sw: { catchable: true },
      sh: { catchable: true },
    },
  },
  {
    id: 'beldum',
    availabilityByGame: {
      sv: { catchable: true, notes: 'Single-spawn area, Masuda is faster.' },
    },
  },
  {
    id: 'rotom',
    availabilityByGame: {
      sv: { catchable: true, locked: true, notes: 'Static spawn; shiny locked.' },
      sw: { catchable: true, locked: true },
    },
  },
];

const curatedById = new Map(curated.map((c) => [c.id, c]));

function mergeOne(base: typeof generatedPokemon[number] | undefined, c: CuratedSpecies | undefined): Species | null {
  if (!base && !c) return null;
  if (base && c) {
    return {
      id: base.id,
      dexNumber: c.dexNumber ?? base.dexNumber,
      name: c.name ?? base.name,
      types: c.types ?? base.types,
      sprites: c.sprites ?? base.sprites,
      availabilityByGame: c.availabilityByGame,
    };
  }
  if (base) {
    return {
      id: base.id,
      dexNumber: base.dexNumber,
      name: base.name,
      types: base.types,
      sprites: base.sprites,
      availabilityByGame: {},
    };
  }
  // curated only (no generated entry yet, e.g. limited sync)
  if (!c) return null;
  return {
    id: c.id,
    dexNumber: c.dexNumber ?? 0,
    name: c.name ?? c.id,
    types: c.types ?? [],
    sprites: c.sprites,
    availabilityByGame: c.availabilityByGame,
  };
}

const merged: Species[] = [];
const seen = new Set<string>();

for (const g of generatedPokemon) {
  const c = curatedById.get(g.id);
  const m = mergeOne(g, c);
  if (m) {
    merged.push(m);
    seen.add(g.id);
  }
}
for (const c of curated) {
  if (seen.has(c.id)) continue;
  const m = mergeOne(undefined, c);
  if (m) merged.push(m);
}

merged.sort((a, b) => a.dexNumber - b.dexNumber || a.id.localeCompare(b.id));

export const species: Species[] = merged;

export const speciesById = Object.fromEntries(
  species.map((s) => [s.id, s]),
) as Record<string, Species>;
