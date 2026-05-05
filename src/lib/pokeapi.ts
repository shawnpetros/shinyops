import type { PokeType } from './types';

const VALID_TYPES = new Set<string>([
  'normal', 'fighting', 'flying', 'poison', 'ground',
  'rock', 'bug', 'ghost', 'steel', 'fire',
  'water', 'grass', 'electric', 'psychic', 'ice',
  'dragon', 'dark', 'fairy',
]);

export interface GeneratedSprites {
  default?: string;
  shiny?: string;
  artwork?: string;
  artworkShiny?: string;
}

export interface GeneratedPokemon {
  id: string;
  dexNumber: number;
  name: string;
  types: PokeType[];
  sprites: GeneratedSprites;
}

export interface RawPokemonResponse {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  sprites: {
    front_default?: string | null;
    front_shiny?: string | null;
    other?: {
      'official-artwork'?: {
        front_default?: string | null;
        front_shiny?: string | null;
      };
    };
  };
  is_default?: boolean;
  species: { name: string; url: string };
}

export function displayName(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

export function normalizePokemon(
  raw: RawPokemonResponse,
  dexNumber: number,
): GeneratedPokemon {
  const types = (raw.types ?? [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)
    .filter((t): t is PokeType => VALID_TYPES.has(t));

  const sprites: GeneratedSprites = {};
  const front = raw.sprites?.front_default ?? undefined;
  const shiny = raw.sprites?.front_shiny ?? undefined;
  const artwork = raw.sprites?.other?.['official-artwork']?.front_default ?? undefined;
  const artworkShiny = raw.sprites?.other?.['official-artwork']?.front_shiny ?? undefined;
  if (front) sprites.default = front;
  if (shiny) sprites.shiny = shiny;
  if (artwork) sprites.artwork = artwork;
  if (artworkShiny) sprites.artworkShiny = artworkShiny;

  return {
    id: raw.name,
    dexNumber,
    name: displayName(raw.name),
    types,
    sprites,
  };
}

export function isShinyHuntableForm(slug: string): boolean {
  const parts = slug.split('-');
  if (parts.includes('mega')) return false;
  if (parts.includes('gmax')) return false;
  if (parts.includes('totem')) return false;
  if (parts.includes('cap')) return false;
  return true;
}
