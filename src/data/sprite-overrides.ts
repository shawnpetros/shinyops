// Manual sprite URL overrides keyed by PokeAPI slug.
//
// The provider chain in src/lib/sprite-providers.ts derives most URLs from a
// species id, but a small set of forms either:
//   - have a different slug per host (e.g. PokemonDB renames `alola` to
//     `alolan`, but Showdown wants `alola` concatenated)
//   - aren't reliably hosted everywhere
//   - have a non-obvious id PokeAPI doesn't expose
//
// Rather than embed regex soup in the chain, every weird case lives here as
// an explicit override. Each entry can supply any subset of provider URLs;
// the chain tries them at their normal priority slot and falls through to
// the derived URLs / non-shiny fallback when missing.
//
// IMPORTANT: This file lists URLs only. We never download or vendor sprite
// images. See SPEC.md §11 for the source-of-truth policy.

export interface SpriteOverride {
  // Optional human-readable note explaining why this override exists.
  notes?: string;
  // Animated shiny GIF (Pokemon Showdown).
  showdownAnimatedShiny?: string;
  // Static shiny png from PokeAPI repo.
  pokeapiShiny?: string;
  // Static non-shiny png from PokeAPI repo.
  pokeapiDefault?: string;
  // Static shiny PNG from PokemonDB HOME.
  pokemondbHomeShiny?: string;
  // Static non-shiny PNG from PokemonDB HOME.
  pokemondbHome?: string;
  // Serebii shiny page artwork.
  serebiiShiny?: string;
  // Official artwork (shiny / default), typically PokeAPI sugimori scans.
  artworkShiny?: string;
  artworkDefault?: string;
}

// Keyed by PokeAPI slug (matches `Species.id`). New entries should be added
// only when the derived slug rules in `sprite-naming.ts` produce a wrong or
// missing URL for that species across the chain.
export const spriteOverrides: Record<string, SpriteOverride> = {};
