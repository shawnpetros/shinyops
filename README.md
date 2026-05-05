# ShinyOps

Modern shiny-hunting planner for Pokemon. First-class modules for **Pokemon Legends: Z-A** and **Pokemon Scarlet/Violet**. Vite + React + TypeScript, no UI framework, mobile-friendly, all data in explicit hand-curated TS files.

The full product / data / mechanics spec lives in [`SPEC.md`](./SPEC.md).

## Run

```bash
npm install
npm run dev                              # dev server
npm test                                 # vitest run
npm run build                            # tsc check + vite build
npm run sync:pokemon -- --limit 30       # generate dex data (dev-friendly subset)
npm run sync:pokemon                     # full National Dex (cached after first run)
```

## What's in here

```
scripts/
  sync-pokemon.mjs        PokeAPI ingestion (caches under .cache/pokeapi)
src/
  data/
    categories.ts         chip taxonomy (✨ 🧲 🔁 🥪 🍩 🗺️ 🧬 🏙️ 🚫)
    games.ts              supported games + per-game mechanics
    methods.ts            hunt methods, with rolls + sources per row
    species.ts            curated availability overlay (lock rules, fossils, scans)
    generated/pokemon.ts  AUTO-GENERATED National Dex (names, types, sprite URLs)
    sv.ts                 Scarlet/Violet state, roll math, recipe table
    za.ts                 Legends: Z-A state, roll math, lock rules
  lib/
    odds.ts               rollsToOdds + compareOdds (load-bearing math)
    odds.test.ts          table-driven tests
    pokeapi.ts            PokeAPI response normalizer (typed)
    pokeapi.test.ts       parser/normalizer tests
    storage.ts            tiny localStorage wrapper, namespaced shinyops:*
    types.ts              shared types
  components/
    App.tsx               tab shell
    CalculatorPanel       pick target + games + see ranked methods
    Sprite                sprite renderer with shiny variant + initial-letter fallback
    ZAModule              Z-A deep planner
    SVModule              SV deep planner with recipe panel
    DexTracker            per-species status tracker
    Legend                chip legend reference
```

The `generated/pokemon.ts` file is produced by `npm run sync:pokemon`. Re-runs hit the disk cache under `.cache/pokeapi/` so they're cheap. Curated overlay in `species.ts` wins for any field it sets (e.g. "starter, shiny locked"), generated data fills the rest.

## Tabs

- **Calculator** — pick a target species, check the games you own, see methods ranked by best odds across those games. Shiny-locked targets surface a warning. Charm-required methods are dimmed when you don't have the charm checked.
- **🏙️ Z-A Mode** — encounter mode + Shiny Charm + Sparkling level + donut type. Surfaces fossil-charm exception, Lv. 3 forced-shiny note, scan exceptions, static-lock warning.
- **🥪 SV Mode** — encounter mode + Charm + Sparkling Lv. 3 sandwich + outbreak count + Masuda. Type-targeted recipe card from Game8. Best-stack tip and Let's Go mode tip.
- **Dex tracker** — per-species status (`Needed | Hunting | Caught | Locked`) with filter buttons and counts. Persisted.
- **Legend** — chip glossary so the UI explains itself.

## Odds model

Source of truth is **rolls**. The display formula is `1 / (4096 / rolls)`, rounded to 2 decimals. This matches the SPEC's display rule.

Note: some community references (e.g. RotomLabs, IGN) publish slightly different denominators because they use the probability-of-at-least-one model `1 / (1 - (1 - 1/4096)^rolls)`. The two differ by less than 0.5%; for example 4 rolls gives 1/1024.00 (this app) vs 1/1024.38 (probability model). The ranking of methods is identical either way.

Tests cover:

- the rolls → odds table for 1..8
- ZA computation across all five modes including fossil charm-exception and static lock
- SV computation including the best 8-roll stack
- compareOdds ordering (better odds first, locked last)

Run them with `npm test`.

## Sprite provider chain

The `<Sprite>` component takes a `Species` and a `variant` (`default | shiny | artwork | animatedShiny`) and tries a chain of provider URLs in priority order. On `onError` it advances to the next candidate; the final fallback is an initial-letter avatar so layout never collapses.

For shiny variants, the chain is:

1. local override (`src/data/sprite-overrides.ts`) - URL only, never a checked-in image
2. Pokemon Showdown animated shiny GIF (`play.pokemonshowdown.com/sprites/ani-shiny/<slug>.gif`)
3. PokeAPI shiny PNG (`sprites.shiny`, ingested in `src/data/generated/pokemon.ts`)
4. PokemonDB HOME shiny PNG (`img.pokemondb.net/sprites/home/shiny/<slug>.png`)
5. Serebii shiny PNG - **opt-in only** (coverage and dimensions are inconsistent across gens)
6. PokeAPI official-artwork shiny, then non-shiny artwork, then `front_default`
7. initial-letter avatar fallback

For default / artwork variants the chain skips Showdown / PokemonDB-shiny / Serebii.

Slug normalization (lowercase, ascii-fold, strip apostrophes / periods / colons / spaces, gender symbols → f/m, regional rename for PokemonDB) lives in `src/lib/sprite-naming.ts` and is unit-tested in `src/lib/sprite-naming.test.ts`. Edge-case forms that the generic rules can't reach get a typed entry in `sprite-overrides.ts` instead of regex creep in the chain.

The original SkywardTARDIS PokemonShinyGuide used a similar Showdown → PokemonDB → Serebii ordering plus vendored Paldea GIFs. We use the same provider order as a reference but **do not copy any of their assets**; everything is URL-based.

### Optional offline cache (opt-in)

`scripts/cache-sprites.mjs` can pull a small subset of sprite URLs into `public/sprites/cache/` for offline dev. It refuses to run without explicit flags and the cache directory is gitignored:

```bash
node scripts/cache-sprites.mjs --help
node scripts/cache-sprites.mjs --provider pokeapi --limit 3 --dry-run
node scripts/cache-sprites.mjs --provider pokeapi-shiny --limit 30
```

Cached sprite assets are **not committed**. They are third-party imagery (Nintendo / TPC / Game Freak); availability through these CDNs is not a license to redistribute. See SPEC.md §11.

## Sources

The mechanic facts encoded in `src/data/za.ts`, `src/data/sv.ts`, and `src/data/methods.ts` come from these public references. Each method record carries its source URL.

Pokemon Legends: Z-A:

- RotomLabs Z-A shiny rates page (citing Anubis/Sibuna datamine)
- IGN Pokemon Legends: Z-A wiki
- Serebii Z-A shiny page

Pokemon Scarlet/Violet:

- Serebii SV shiny page
- IGN SV wiki (cites Anubis/Sibuna datamine)
- Game8 SV Sparkling Power Lv. 3 fewest-ingredient recipe table

## Caveats

- Odds come from community datamines; first-party numbers are not published. Treat them as best-known.
- The Z-A fossil charm-exclusion is the consensus reading; treat as best-known until first-party confirms.
- Sparkling Power Lv. 3 forced-first-shiny (Z-A) is asserted by datamine and not officially confirmed.
- Recipes are the simplest known route per type. Many other Lv. 3 paths exist.
- Locked-species lists reflect launch-window community testing.
- The committed `src/data/generated/pokemon.ts` reflects whatever `--limit` was used last; run `npm run sync:pokemon` (no flags) for full National Dex.

## Source policy and attribution

- **Mechanic data** (rolls, recipes, lock rules) is hand-curated text, sourced from RotomLabs, IGN, Serebii, Game8, Bulbapedia. Each method/recipe carries its source URL.
- **Dex / sprite metadata** comes from PokeAPI (pokeapi.co), a free open GET API. The sync script caches every fetch and defaults to concurrency 4 to stay polite.
- **Sprite imagery is not vendored.** PokeAPI URLs point at images owned by Nintendo, The Pokemon Company, and Game Freak. Availability through PokeAPI is not a license. The repository stores URLs only; the browser fetches the images at render time. No sprite assets are checked in.
- This setup is fine for personal / educational / portfolio use. Any commercial release would need to either license the imagery or replace it.

## License

For personal/educational use during the prototype phase. No commercial use of any Pokemon trademarks.
