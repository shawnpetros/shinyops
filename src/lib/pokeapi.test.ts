import { describe, expect, it } from 'vitest';
import { displayName, isShinyHuntableForm, normalizePokemon, type RawPokemonResponse } from './pokeapi';

const sampleBulbasaur: RawPokemonResponse = {
  id: 1,
  name: 'bulbasaur',
  is_default: true,
  types: [
    { slot: 1, type: { name: 'grass' } },
    { slot: 2, type: { name: 'poison' } },
  ],
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    front_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
    other: {
      'official-artwork': {
        front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        front_shiny: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/1.png',
      },
    },
  },
  species: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
};

const sampleNoArtwork: RawPokemonResponse = {
  id: 999,
  name: 'gimmighoul',
  types: [{ slot: 1, type: { name: 'ghost' } }],
  sprites: {
    front_default: 'https://example.test/999.png',
  },
  species: { name: 'gimmighoul', url: 'https://pokeapi.co/api/v2/pokemon-species/999/' },
};

describe('displayName', () => {
  it('title-cases simple slugs', () => {
    expect(displayName('bulbasaur')).toBe('Bulbasaur');
  });

  it('title-cases each segment of multi-part slugs', () => {
    expect(displayName('mr-mime')).toBe('Mr Mime');
    expect(displayName('deoxys-attack')).toBe('Deoxys Attack');
  });
});

describe('normalizePokemon', () => {
  it('extracts id, dex number, name, types, and sprite urls', () => {
    const result = normalizePokemon(sampleBulbasaur, 1);
    expect(result.id).toBe('bulbasaur');
    expect(result.dexNumber).toBe(1);
    expect(result.name).toBe('Bulbasaur');
    expect(result.types).toEqual(['grass', 'poison']);
    expect(result.sprites.default).toContain('/1.png');
    expect(result.sprites.shiny).toContain('/shiny/1.png');
    expect(result.sprites.artwork).toContain('official-artwork/1.png');
    expect(result.sprites.artworkShiny).toContain('official-artwork/shiny/1.png');
  });

  it('orders types by slot regardless of source order', () => {
    const reversed: RawPokemonResponse = {
      ...sampleBulbasaur,
      types: [
        { slot: 2, type: { name: 'poison' } },
        { slot: 1, type: { name: 'grass' } },
      ],
    };
    expect(normalizePokemon(reversed, 1).types).toEqual(['grass', 'poison']);
  });

  it('omits missing sprite fields rather than emitting null', () => {
    const result = normalizePokemon(sampleNoArtwork, 999);
    expect(result.sprites.default).toBe('https://example.test/999.png');
    expect(result.sprites.shiny).toBeUndefined();
    expect(result.sprites.artwork).toBeUndefined();
    expect(result.sprites.artworkShiny).toBeUndefined();
  });

  it('drops type names not in the canonical 18-type set', () => {
    const bogus: RawPokemonResponse = {
      ...sampleBulbasaur,
      types: [
        { slot: 1, type: { name: 'grass' } },
        { slot: 2, type: { name: 'unknown' } },
      ],
    };
    expect(normalizePokemon(bogus, 1).types).toEqual(['grass']);
  });

  it('uses the dexNumber argument over raw.id for display ordering', () => {
    const result = normalizePokemon(sampleBulbasaur, 42);
    expect(result.dexNumber).toBe(42);
  });
});

describe('isShinyHuntableForm', () => {
  it('keeps base species', () => {
    expect(isShinyHuntableForm('bulbasaur')).toBe(true);
    expect(isShinyHuntableForm('charizard')).toBe(true);
  });

  it('drops mega and gigantamax slugs', () => {
    expect(isShinyHuntableForm('charizard-mega-x')).toBe(false);
    expect(isShinyHuntableForm('charizard-mega-y')).toBe(false);
    expect(isShinyHuntableForm('venusaur-mega')).toBe(false);
    expect(isShinyHuntableForm('charizard-gmax')).toBe(false);
  });

  it('drops totem and special pikachu cap forms', () => {
    expect(isShinyHuntableForm('raticate-totem-alola')).toBe(false);
    expect(isShinyHuntableForm('pikachu-original-cap')).toBe(false);
  });

  it('keeps regional/form variants like alolan and galarian', () => {
    expect(isShinyHuntableForm('raichu-alola')).toBe(true);
    expect(isShinyHuntableForm('weezing-galar')).toBe(true);
    expect(isShinyHuntableForm('deoxys-attack')).toBe(true);
  });
});
