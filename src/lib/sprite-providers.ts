import { spriteOverrides, type SpriteOverride } from '../data/sprite-overrides';
import type { Species } from './types';
import {
  pokemondbHomeShinyUrl,
  pokemondbHomeUrl,
  serebiiShinyUrl,
  showdownAnimatedShinyUrl,
} from './sprite-naming';

export type SpriteVariant = 'default' | 'shiny' | 'artwork' | 'animatedShiny';

export type SpriteProvider =
  | 'override'
  | 'showdown'
  | 'pokeapi'
  | 'pokemondb'
  | 'serebii'
  | 'artwork'
  | 'fallback';

export interface SpriteCandidate {
  url: string;
  provider: SpriteProvider;
}

export interface BuildCandidatesOptions {
  variant?: SpriteVariant;
  // Serebii shiny coverage and sizing varies by gen and is unreliable. Off by
  // default; consumers can opt-in (e.g. for an admin debug view).
  includeSerebii?: boolean;
}

function pushIf(out: SpriteCandidate[], url: string | undefined, provider: SpriteProvider) {
  if (!url) return;
  if (out.some((c) => c.url === url)) return;
  out.push({ url, provider });
}

function shinyCandidates(
  species: Species,
  override: SpriteOverride | undefined,
  options: BuildCandidatesOptions,
): SpriteCandidate[] {
  const out: SpriteCandidate[] = [];
  pushIf(out, override?.showdownAnimatedShiny, 'override');
  pushIf(out, showdownAnimatedShinyUrl(species.id), 'showdown');
  pushIf(out, override?.pokeapiShiny, 'override');
  pushIf(out, species.sprites?.shiny, 'pokeapi');
  pushIf(out, override?.pokemondbHomeShiny, 'override');
  pushIf(out, pokemondbHomeShinyUrl(species.id), 'pokemondb');
  if (options.includeSerebii) {
    pushIf(out, override?.serebiiShiny, 'override');
    pushIf(out, serebiiShinyUrl(species.dexNumber), 'serebii');
  }
  pushIf(out, override?.artworkShiny, 'override');
  pushIf(out, species.sprites?.artworkShiny, 'artwork');
  // Final non-shiny fallbacks so the slot is never blank.
  pushIf(out, species.sprites?.artwork, 'artwork');
  pushIf(out, species.sprites?.default, 'pokeapi');
  return out;
}

function defaultCandidates(
  species: Species,
  override: SpriteOverride | undefined,
): SpriteCandidate[] {
  const out: SpriteCandidate[] = [];
  pushIf(out, override?.pokeapiDefault, 'override');
  pushIf(out, species.sprites?.default, 'pokeapi');
  pushIf(out, override?.pokemondbHome, 'override');
  pushIf(out, pokemondbHomeUrl(species.id), 'pokemondb');
  pushIf(out, override?.artworkDefault, 'override');
  pushIf(out, species.sprites?.artwork, 'artwork');
  return out;
}

function artworkCandidates(
  species: Species,
  override: SpriteOverride | undefined,
  shinyPreferred: boolean,
): SpriteCandidate[] {
  const out: SpriteCandidate[] = [];
  if (shinyPreferred) {
    pushIf(out, override?.artworkShiny, 'override');
    pushIf(out, species.sprites?.artworkShiny, 'artwork');
  }
  pushIf(out, override?.artworkDefault, 'override');
  pushIf(out, species.sprites?.artwork, 'artwork');
  pushIf(out, species.sprites?.default, 'pokeapi');
  return out;
}

function animatedShinyCandidates(
  species: Species,
  override: SpriteOverride | undefined,
  options: BuildCandidatesOptions,
): SpriteCandidate[] {
  const out: SpriteCandidate[] = [];
  pushIf(out, override?.showdownAnimatedShiny, 'override');
  pushIf(out, showdownAnimatedShinyUrl(species.id), 'showdown');
  // If the GIF 404s, fall through to the static shiny chain.
  for (const c of shinyCandidates(species, override, options)) {
    pushIf(out, c.url, c.provider);
  }
  return out;
}

export function buildSpriteCandidates(
  species: Species,
  options: BuildCandidatesOptions = {},
): SpriteCandidate[] {
  const variant = options.variant ?? 'default';
  const override = spriteOverrides[species.id];

  switch (variant) {
    case 'shiny':
      return shinyCandidates(species, override, options);
    case 'artwork':
      return artworkCandidates(species, override, false);
    case 'animatedShiny':
      return animatedShinyCandidates(species, override, options);
    case 'default':
    default:
      return defaultCandidates(species, override);
  }
}
