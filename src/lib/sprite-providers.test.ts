import { describe, expect, it } from 'vitest';
import { buildSpriteCandidates } from './sprite-providers';
import type { Species } from './types';

const pikachu: Species = {
  id: 'pikachu',
  dexNumber: 25,
  name: 'Pikachu',
  types: ['electric'],
  sprites: {
    default: 'https://pokeapi.test/25.png',
    shiny: 'https://pokeapi.test/shiny/25.png',
    artwork: 'https://pokeapi.test/artwork/25.png',
    artworkShiny: 'https://pokeapi.test/artwork/shiny/25.png',
  },
  availabilityByGame: {},
};

const mrMime: Species = {
  id: 'mr-mime',
  dexNumber: 122,
  name: 'Mr. Mime',
  types: ['psychic', 'fairy'],
  sprites: {
    default: 'https://pokeapi.test/122.png',
    shiny: 'https://pokeapi.test/shiny/122.png',
  },
  availabilityByGame: {},
};

const noSprites: Species = {
  id: 'unown',
  dexNumber: 201,
  name: 'Unown',
  types: ['psychic'],
  availabilityByGame: {},
};

describe('buildSpriteCandidates - shiny variant', () => {
  it('orders Showdown gif first, then PokeAPI shiny png, then PokemonDB HOME, with non-shiny fallback last', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'shiny' });
    const providers = candidates.map((c) => c.provider);
    expect(candidates[0].url).toBe('https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif');
    expect(candidates[0].provider).toBe('showdown');
    expect(providers).toContain('pokeapi');
    expect(providers).toContain('pokemondb');
    expect(providers).not.toContain('serebii'); // off by default
    // PokeAPI shiny png must come before PokemonDB
    const pokeapiIdx = candidates.findIndex((c) => c.url === pikachu.sprites!.shiny);
    const pokemondbIdx = candidates.findIndex((c) => c.provider === 'pokemondb');
    expect(pokeapiIdx).toBeLessThan(pokemondbIdx);
    // Non-shiny fallbacks must appear after shiny variants
    const lastShinyIdx = candidates.findIndex((c) => c.url === pikachu.sprites!.artworkShiny);
    const nonShinyArtworkIdx = candidates.findIndex((c) => c.url === pikachu.sprites!.artwork);
    expect(lastShinyIdx).toBeLessThan(nonShinyArtworkIdx);
  });

  it('includes Serebii URL only when opted in', () => {
    const off = buildSpriteCandidates(pikachu, { variant: 'shiny' });
    const on = buildSpriteCandidates(pikachu, { variant: 'shiny', includeSerebii: true });
    expect(off.find((c) => c.provider === 'serebii')).toBeUndefined();
    expect(on.find((c) => c.provider === 'serebii')?.url).toBe(
      'https://www.serebii.net/Shiny/SWSH/025.png',
    );
  });

  it('handles slug normalization for hyphenated ids (mr-mime)', () => {
    const candidates = buildSpriteCandidates(mrMime, { variant: 'shiny' });
    expect(candidates[0].url).toBe('https://play.pokemonshowdown.com/sprites/ani-shiny/mrmime.gif');
    const pokemondb = candidates.find((c) => c.provider === 'pokemondb');
    expect(pokemondb?.url).toBe('https://img.pokemondb.net/sprites/home/shiny/mr-mime.png');
  });

  it('still produces a candidate list when species has no sprite metadata', () => {
    const candidates = buildSpriteCandidates(noSprites, { variant: 'shiny' });
    expect(candidates.length).toBeGreaterThan(0);
    // First candidate is the derived Showdown URL
    expect(candidates[0].provider).toBe('showdown');
  });
});

describe('buildSpriteCandidates - default variant', () => {
  it('prefers PokeAPI default, then PokemonDB HOME, then artwork as last resort', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'default' });
    expect(candidates[0]).toEqual({ url: pikachu.sprites!.default, provider: 'pokeapi' });
    expect(candidates.some((c) => c.provider === 'pokemondb')).toBe(true);
    expect(candidates[candidates.length - 1].provider).toBe('artwork');
  });

  it('does not include shiny URLs in the default chain', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'default' });
    expect(candidates.find((c) => c.url.includes('shiny'))).toBeUndefined();
  });
});

describe('buildSpriteCandidates - artwork variant', () => {
  it('prefers official artwork, then default, then PokeAPI default', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'artwork' });
    expect(candidates[0]).toEqual({ url: pikachu.sprites!.artwork, provider: 'artwork' });
    expect(candidates.some((c) => c.url === pikachu.sprites!.default)).toBe(true);
  });
});

describe('buildSpriteCandidates - animatedShiny variant', () => {
  it('starts with Showdown gif and falls through into the shiny chain', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'animatedShiny' });
    expect(candidates[0].provider).toBe('showdown');
    // pokeapi shiny png must appear later as a fallback
    const pokeapiShinyIdx = candidates.findIndex((c) => c.url === pikachu.sprites!.shiny);
    expect(pokeapiShinyIdx).toBeGreaterThan(0);
  });
});

describe('buildSpriteCandidates - dedup', () => {
  it('does not emit the same URL twice', () => {
    const candidates = buildSpriteCandidates(pikachu, { variant: 'shiny' });
    const urls = candidates.map((c) => c.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
