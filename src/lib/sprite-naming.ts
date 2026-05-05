// Slug helpers that map PokeAPI canonical slugs to the naming conventions
// used by various third-party sprite hosts. The functions are intentionally
// pure and free of host fetches so they can be unit-tested in isolation.

const GENDER_FEMALE = '♀';
const GENDER_MALE = '♂';

function asciiFold(input: string): string {
  return input
    .replace(new RegExp(GENDER_FEMALE, 'g'), 'f')
    .replace(new RegExp(GENDER_MALE, 'g'), 'm')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

function stripPunctuation(input: string): string {
  return input.replace(/[.'":]/g, '');
}

// PokeAPI is our canonical naming. Most of the curated/generated id field
// already follows this scheme, but human-entered names need normalization.
export function slugifyPokeAPI(name: string): string {
  return stripPunctuation(asciiFold(name).toLowerCase())
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pokemon Showdown's animated-shiny sprite host expects a tightly compressed
// slug: lowercase, ascii-folded, no hyphens, no punctuation.
export function slugifyShowdown(pokeapiSlug: string): string {
  return stripPunctuation(asciiFold(pokeapiSlug).toLowerCase()).replace(/[\s-]+/g, '');
}

// PokemonDB keeps hyphens but renames a few regional suffixes.
const POKEMONDB_SUFFIX_RENAMES: Record<string, string> = {
  alola: 'alolan',
  galar: 'galarian',
  hisui: 'hisuian',
  paldea: 'paldean',
};

export function slugifyPokemonDB(pokeapiSlug: string): string {
  const cleaned = stripPunctuation(asciiFold(pokeapiSlug).toLowerCase()).replace(/\s+/g, '-');
  const parts = cleaned.split('-');
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const rename = POKEMONDB_SUFFIX_RENAMES[last];
    if (rename) parts[parts.length - 1] = rename;
  }
  return parts.join('-');
}

// Serebii's shiny pages are dex-id keyed, not name keyed.
export function serebiiDexPath(dexNumber: number): string {
  return String(dexNumber).padStart(3, '0');
}

// Showdown only hosts a single-form animated sprite for many species. For
// known regional/form variants, the chain should still emit the alt slug
// but consumers fall through to other providers when the URL 404s.
export function showdownAnimatedShinyUrl(pokeapiSlug: string): string {
  return `https://play.pokemonshowdown.com/sprites/ani-shiny/${slugifyShowdown(pokeapiSlug)}.gif`;
}

export function pokemondbHomeShinyUrl(pokeapiSlug: string): string {
  return `https://img.pokemondb.net/sprites/home/shiny/${slugifyPokemonDB(pokeapiSlug)}.png`;
}

export function pokemondbHomeUrl(pokeapiSlug: string): string {
  return `https://img.pokemondb.net/sprites/home/normal/${slugifyPokemonDB(pokeapiSlug)}.png`;
}

export function serebiiShinyUrl(dexNumber: number): string {
  return `https://www.serebii.net/Shiny/SWSH/${serebiiDexPath(dexNumber)}.png`;
}
