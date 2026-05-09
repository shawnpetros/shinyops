import type { Species, SpeciesAvailability, SpeciesSprites, GameId, PokeType } from '../lib/types';
import { availabilityBySpecies } from './generated/availability';
import { generatedPokemon } from './generated/pokemon';

// Regional forms (Hisuian, Galarian, Alolan, Paldean) must NOT inherit base
// species availability. Doing so conflated e.g. Hisuian Sneasel with regular
// Sneasel and broke transfer/encounter-table semantics. Curated entries below
// supply explicit availability per form.
const REGIONAL_FORM_SUFFIX = /-(hisui|galar|alola|paldea)$/;

function baselineAvailability(
  id: string,
  speciesId: string | undefined,
): Partial<Record<GameId, SpeciesAvailability>> {
  const isRegionalForm = REGIONAL_FORM_SUFFIX.test(id);
  const games = isRegionalForm
    ? availabilityBySpecies[id]
    : availabilityBySpecies[speciesId ?? id] ?? availabilityBySpecies[id];
  if (!games) return {};
  const out: Partial<Record<GameId, SpeciesAvailability>> = {};
  for (const g of games) out[g] = { catchable: true };
  return out;
}

// Build a curated entry for a regional-variant form: catchable in the listed
// "home" games, transfer-only in the listed "transfer" games. Encodes the
// canonical wild-encounter region of the form plus the HOME-transferable
// destinations where breeding works but outbreak/sandwich do not.
function regionalForm(
  id: string,
  homeGames: GameId[],
  transferGames: GameId[],
): CuratedSpecies {
  const availabilityByGame: Partial<Record<GameId, SpeciesAvailability>> = {};
  for (const g of homeGames) availabilityByGame[g] = { catchable: true };
  for (const g of transferGames) {
    availabilityByGame[g] = {
      catchable: true,
      transferOnly: true,
      notes: 'HOME transfer only - no wild encounters in this game.',
    };
  }
  return { id, availabilityByGame };
}

// HOME transfer destinations relevant to each form's home region.
const HISUI_TRANSFER: GameId[] = ['bdsp', 'sv', 'sw', 'sh'];
const GALAR_TRANSFER: GameId[] = ['bdsp', 'sv', 'la'];
const ALOLA_TRANSFER: GameId[] = ['bdsp', 'sv', 'la'];
const PALDEA_TRANSFER: GameId[] = ['sw', 'sh', 'la'];

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

  // ---- Regional forms ----
  // Hisuian forms: native to Pokémon Legends: Arceus. Transferable via HOME
  // to BDSP/SwSh/SV but not naturally encounterable there.
  // Caveat: Hisuian Decidueye / Sneasler / Typhlosion returned as wild
  // catches in SV's Indigo Disk DLC. If you want those promoted from
  // transfer-only to catchable in SV, override here.
  regionalForm('arcanine-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('avalugg-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('braviary-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('decidueye-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('electrode-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('goodra-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('growlithe-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('lilligant-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('qwilfish-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('samurott-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('sliggoo-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('sneasel-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('typhlosion-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('voltorb-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('zoroark-hisui', ['la'], HISUI_TRANSFER),
  regionalForm('zorua-hisui', ['la'], HISUI_TRANSFER),

  // Galarian forms: native to Sword/Shield (Galar region). Transferable via
  // HOME to BDSP/SV/PLA but not naturally encounterable there.
  regionalForm('articuno-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('corsola-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('darumaka-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('farfetchd-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('linoone-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('meowth-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('moltres-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('mr-mime-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('ponyta-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('rapidash-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('slowbro-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('slowking-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('slowpoke-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('stunfisk-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('weezing-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('yamask-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('zapdos-galar', ['sw', 'sh'], GALAR_TRANSFER),
  regionalForm('zigzagoon-galar', ['sw', 'sh'], GALAR_TRANSFER),

  // Alolan forms: native to SM/USUM (not in this dataset's game list).
  // Wild-catchable in SwSh via the Crown Tundra DLC. Transferable elsewhere.
  regionalForm('diglett-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('dugtrio-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('exeggutor-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('geodude-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('golem-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('graveler-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('grimer-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('marowak-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('meowth-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('muk-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('ninetales-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('persian-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('raichu-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('raticate-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('rattata-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('sandshrew-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('sandslash-alola', ['sw', 'sh'], ALOLA_TRANSFER),
  regionalForm('vulpix-alola', ['sw', 'sh'], ALOLA_TRANSFER),

  // Paldean forms: native to SV. Paldean Wooper evolves into Clodsire.
  regionalForm('wooper-paldea', ['sv'], PALDEA_TRANSFER),
];

const curatedById = new Map(curated.map((c) => [c.id, c]));

function mergeOne(base: typeof generatedPokemon[number] | undefined, c: CuratedSpecies | undefined): Species | null {
  if (!base && !c) return null;
  if (base && c) {
    const baseline = baselineAvailability(base.id, base.speciesId);
    return {
      id: base.id,
      dexNumber: c.dexNumber ?? base.dexNumber,
      name: c.name ?? base.name,
      types: c.types ?? base.types,
      sprites: c.sprites ?? base.sprites,
      availabilityByGame: { ...baseline, ...c.availabilityByGame },
    };
  }
  if (base) {
    return {
      id: base.id,
      dexNumber: base.dexNumber,
      name: base.name,
      types: base.types,
      sprites: base.sprites,
      availabilityByGame: baselineAvailability(base.id, base.speciesId),
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
    availabilityByGame: { ...baselineAvailability(c.id, undefined), ...c.availabilityByGame },
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
