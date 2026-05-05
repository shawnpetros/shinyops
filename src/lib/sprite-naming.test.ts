import { describe, expect, it } from 'vitest';
import {
  pokemondbHomeShinyUrl,
  serebiiDexPath,
  serebiiShinyUrl,
  showdownAnimatedShinyUrl,
  slugifyPokeAPI,
  slugifyPokemonDB,
  slugifyShowdown,
} from './sprite-naming';

describe('slugifyPokeAPI', () => {
  it('lowercases and hyphenates simple names', () => {
    expect(slugifyPokeAPI('Pikachu')).toBe('pikachu');
    expect(slugifyPokeAPI('Mr. Mime')).toBe('mr-mime');
    expect(slugifyPokeAPI('Mime Jr.')).toBe('mime-jr');
  });

  it("strips apostrophes (Farfetch'd)", () => {
    expect(slugifyPokeAPI("Farfetch'd")).toBe('farfetchd');
    expect(slugifyPokeAPI("Sirfetch'd")).toBe('sirfetchd');
  });

  it('maps gender symbols to f/m', () => {
    expect(slugifyPokeAPI('Nidoran♀')).toBe('nidoranf');
    expect(slugifyPokeAPI('Nidoran♂')).toBe('nidoranm');
  });

  it('drops accents (Flabébé)', () => {
    expect(slugifyPokeAPI('Flabébé')).toBe('flabebe');
  });

  it('handles colons (Type: Null)', () => {
    expect(slugifyPokeAPI('Type: Null')).toBe('type-null');
  });
});

describe('slugifyShowdown', () => {
  it('strips all hyphens and punctuation', () => {
    expect(slugifyShowdown('mr-mime')).toBe('mrmime');
    expect(slugifyShowdown('mime-jr')).toBe('mimejr');
    expect(slugifyShowdown('farfetchd')).toBe('farfetchd');
    expect(slugifyShowdown('nidoran-f')).toBe('nidoranf');
    expect(slugifyShowdown('type-null')).toBe('typenull');
    expect(slugifyShowdown('jangmo-o')).toBe('jangmoo');
    expect(slugifyShowdown('hakamo-o')).toBe('hakamoo');
    expect(slugifyShowdown('kommo-o')).toBe('kommoo');
  });

  it('handles regional and form slugs', () => {
    expect(slugifyShowdown('raichu-alola')).toBe('raichualola');
    expect(slugifyShowdown('slowking-galar')).toBe('slowkinggalar');
    expect(slugifyShowdown('basculin-white-striped')).toBe('basculinwhitestriped');
  });
});

describe('slugifyPokemonDB', () => {
  it('keeps hyphens for compound forms', () => {
    expect(slugifyPokemonDB('mr-mime')).toBe('mr-mime');
    expect(slugifyPokemonDB('type-null')).toBe('type-null');
    expect(slugifyPokemonDB('basculin-white-striped')).toBe('basculin-white-striped');
  });

  it('renames regional suffixes to PokemonDB style', () => {
    expect(slugifyPokemonDB('raichu-alola')).toBe('raichu-alolan');
    expect(slugifyPokemonDB('slowking-galar')).toBe('slowking-galarian');
    expect(slugifyPokemonDB('decidueye-hisui')).toBe('decidueye-hisuian');
    expect(slugifyPokemonDB('tauros-paldea')).toBe('tauros-paldean');
  });

  it('passes apostrophe-stripped slugs through unchanged', () => {
    expect(slugifyPokemonDB('farfetchd')).toBe('farfetchd');
  });
});

describe('serebiiDexPath', () => {
  it('zero-pads to 3 digits', () => {
    expect(serebiiDexPath(1)).toBe('001');
    expect(serebiiDexPath(25)).toBe('025');
    expect(serebiiDexPath(150)).toBe('150');
    expect(serebiiDexPath(1025)).toBe('1025');
  });
});

describe('host URL helpers', () => {
  it('builds the showdown ani-shiny URL', () => {
    expect(showdownAnimatedShinyUrl('pikachu')).toBe(
      'https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif',
    );
    expect(showdownAnimatedShinyUrl('mr-mime')).toBe(
      'https://play.pokemonshowdown.com/sprites/ani-shiny/mrmime.gif',
    );
  });

  it('builds the PokemonDB HOME shiny URL with renamed regional suffix', () => {
    expect(pokemondbHomeShinyUrl('raichu-alola')).toBe(
      'https://img.pokemondb.net/sprites/home/shiny/raichu-alolan.png',
    );
  });

  it('builds the Serebii shiny URL from dex number', () => {
    expect(serebiiShinyUrl(25)).toBe('https://www.serebii.net/Shiny/SWSH/025.png');
  });
});
