# ShinyOps — Pokemon Shiny Hunting Planner

A clean, mobile-friendly rebuild of the original "Comprehensive Shiny Hunting Guide" with first-class modules for **Pokemon Legends: Z-A** and **Pokemon Scarlet/Violet**.

Status: spec + prototype scaffold (Phase 1).
Target: any modern browser. Mobile-first.

---

## 1. Product

### 1.1 Premise

Shiny hunting is a planning problem. Across ~30 mainline games the player has to juggle:

- which game owns the target species
- which mechanics are available in that game (Masuda, charm, sandwiches, donuts, outbreaks, scans, fossils, breeding)
- which boost stack actually applies to that species
- which boosts are mutually exclusive
- which targets are shiny-locked

The original tool surfaced this with a giant Bootstrap form. ShinyOps replaces it with a focused planner that:

1. lets you pick a target species (search-first, not a 1000-row select)
2. asks which games and charms you own
3. returns ranked methods with explicit odds and category chips
4. for the two flagship modern games (Z-A, SV) provides a deep mechanic-aware mode

### 1.2 Top-level views

- **Calculator** — pick a species → see every viable hunt method across owned games, ranked by best odds.
- **Z-A Mode** — single-game deep planner with Sparkling level, Shiny Charm, donut type, fossil/scan/lock callouts.
- **SV Mode** — single-game deep planner with outbreak count, Sparkling Power Lv. 3 sandwich, Masuda toggle, recipe panel by type.
- **Dex Tracker** — per-game (or all-game) progress board with status filters.

### 1.3 Non-goals (MVP)

- Account sync. localStorage only.
- Drop calculators / encounter sims. The site **plans**, it does not simulate.
- Trade/raid hunting. Out of scope.
- Auto-importing GAME8/Serebii data. **Mechanic** facts (rolls, recipes, lock rules) stay hand-curated. Bulk **dex** data (names, types, sprite URLs) is generated from PokeAPI - see §11.

### 1.4 Design principles

- **Searchable, not scrollable.** No raw 1000-item selects.
- **One screen, no hidden state.** All toggles affecting the result are visible on the same panel.
- **Explain odds, don't hide them.** Show `rolls / 4096 → 1/N` for every method.
- **Categories as chips.** Every method carries one or more colored chips so the legend is the legend.
- **Sprites by URL, never vendored.** Avatar imagery in the UI loads from PokeAPI sprite URLs at runtime. The repository never ships copies of Nintendo / The Pokemon Company / Game Freak art (see §11).

---

## 2. Data model

All data is hand-curated TypeScript in `src/data/`. Explicit > scraped.

### 2.1 Game

```ts
type Game = {
  id: 'sw' | 'sh' | 'bdsp' | 'la' | 'sv' | 'za' | ...;
  name: string;
  era: 'gen6' | 'gen7' | 'gen8' | 'gen9';
  platform: 'switch' | '3ds' | ...;
  supportedMechanics: Mechanic[];
};
```

### 2.2 Category (chip taxonomy)

```ts
type Category = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string; // CSS variable name
};
```

The base set:

| chip | label                        | meaning                                           |
|------|------------------------------|---------------------------------------------------|
| ✨   | Base odds                     | unboosted vanilla 1/4096 (or game-default)        |
| 🧲   | Charm boosted                 | requires Shiny Charm                              |
| 🔁   | Chain / streak                | DexNav, Catch Combo, BDSP PokeRadar, etc.         |
| 🥪   | Sandwich / food boost         | SV Sparkling Power                                |
| 🍩   | Donut / food boost            | Z-A Sparkling Power                               |
| 🗺️   | Outbreak / spawn boost        | SV mass outbreak, SwSh dynamax adventures         |
| 🧬   | Masuda / breeding             | egg-based                                         |
| 🏙️   | Legends Z-A specific          | Hyperspace, scan, fossil exception                |
| 🚫   | Shiny locked                  | not eligible regardless of method                 |

### 2.3 Method

```ts
type Method = {
  id: string;
  gameId: GameId;
  name: string;                 // 'Wild encounter', 'Mass Outbreak (60+ cleared) + Charm'
  huntType: HuntType;           // 'wild' | 'breed' | 'fossil' | 'scan' | 'static'
  categories: CategoryId[];     // chips
  rolls: number;                // for modern roll-based games
  denominator: number;          // 4096 by default
  oddsLabel: string;            // pre-computed, e.g. '1/512'
  modifiers: Modifier[];        // toggles required: 'shinyCharm' | 'sparkling3' | 'outbreak60' | 'masuda' | ...
  appliesTo: AppliesTo;         // 'all' | { species: SpeciesId[] } | { types: PokeType[] }
  notes?: string;
  sources: string[];            // urls
};
```

### 2.4 Species (full National Dex)

```ts
type Species = {
  id: string;              // 'pikachu'
  dexNumber: number;
  name: string;
  types: PokeType[];
  sprites?: SpeciteSprites;          // optional - missing in older curated entries
  availabilityByGame: Partial<Record<GameId, { catchable: boolean; locked?: boolean; locations?: string[]; }>>;
};

type SpeciteSprites = {
  default?: string;        // PokeAPI front_default URL
  shiny?: string;          // PokeAPI front_shiny URL
  artwork?: string;        // PokeAPI official-artwork front_default URL
  artworkShiny?: string;   // PokeAPI official-artwork front_shiny URL
};
```

The species list is composed in two layers:

1. **Generated baseline** (`src/data/generated/pokemon.ts`) - produced by `npm run sync:pokemon` from PokeAPI. Names, dex numbers, types, sprite URLs. Covers the full National Dex range (currently 1-1025 + recurring forms PokeAPI exposes).
2. **Curated overlay** (`src/data/species.ts`) - mechanic-relevant lock rules, fossil flags, scan exceptions, per-game availability notes. Each curated entry is keyed by id and merged on top of the generated baseline at runtime (overlay wins for any field it sets).

The merged result is what the UI consumes via `getSpeciesById` / `allSpecies`.

When the generated file is absent (fresh clone before `npm run sync:pokemon`), the curated overlay alone is sufficient for the app to boot, sprites simply fall back to placeholders.

### 2.5 Charm

```ts
type Charm = {
  id: 'shinyCharm';
  gameId: GameId;
  rollsAdded?: number;     // ZA: 3, SV: 2
  notes: string;
};
```

### 2.6 Recipe (SV)

```ts
type SVRecipe = {
  id: string;
  type: PokeType;          // type whose Sparkling Power Lv. 3 it grants
  name: string;            // 'Salty Avocado Tower' etc. (descriptive only)
  ingredients: string[];   // simple primary ingredient list
  flavorNotes: string;     // 'Salty x2'
  durationMin: 30;
  source: string;
};
```

The prototype encodes one **fewest-ingredient** Lv. 3 recipe per type as supplied by Game8.

### 2.7 LockRule

```ts
type LockRule = {
  gameId: GameId;
  scope: 'species' | 'category';
  appliesTo: SpeciesId[] | { static: true } | { starter: true };
  exceptions?: string[];   // free text, e.g. 'fixed Alpha spawns are not static and remain shiny-eligible'
  sources: string[];
};
```

---

## 3. Odds calculation

Source of truth is **rolls**, not pre-computed odds.

```
chancePerSpawn = rolls / denominator
displayedOdds  = denominator / rolls
```

For `denominator = 4096`:

- 1 roll  → 1/4096
- 2 rolls → 1/2048.25
- 3 rolls → 1/1365.67
- 4 rolls → 1/1024.38
- 5 rolls → 1/819.60
- 6 rolls → 1/683.08
- 7 rolls → 1/585.57
- 8 rolls → 1/512.44

Special cases:

- **Masuda** in modern gens: fixed 6 rolls per egg (1/683 base, 1/512 with Charm). Encoded as a fixed-rolls method, not derived from boosts.
- **Fossils (ZA)**: 1 roll, Charm does **not** apply. Encode as `appliesTo: { fossil: true }, modifiers: []`, `rolls: 1`.
- **Legends: Arceus mass outbreak chains**: encoded as discrete tiers, not formulae, in V1.

The `computeOdds(method, modifiers)` function returns:

```ts
{
  rolls: number;
  denominator: number;
  oddsLabel: string;     // '1/512.44'
  per1000: number;       // expected shinies per 1000 spawns
}
```

Tested with table-driven cases that assert each `(rolls, expectedLabel)` pair.

---

## 4. Pokemon Legends: Z-A module

### 4.1 Mechanics encoded

Source priority: RotomLabs (citing Anubis/Sibuna datamine), Serebii, IGN.

| condition                                  | rolls | odds        |
|--------------------------------------------|-------|-------------|
| Wild base                                  | 1     | 1/4096      |
| Sparkling Power Lv. 1                      | 2     | 1/2048.25   |
| Sparkling Power Lv. 2                      | 3     | 1/1365.67   |
| Sparkling Power Lv. 3                      | 4     | 1/1024.38   |
| Shiny Charm                                | 4     | 1/1024.38   |
| Charm + Sparkling Lv. 1                    | 5     | 1/819.60    |
| Charm + Sparkling Lv. 2                    | 6     | 1/683.08    |
| Charm + Sparkling Lv. 3                    | 7     | 1/585.57    |
| Fossil                                     | 1     | 1/4096      |
| Special Scan (Latios/Latias/3 musketeers)  | 1     | 1/4096 (per scan) |

Charm in ZA gives **+3 rolls** (consistent with the table).

### 4.2 Behavioral rules

- **Sparkling Power** comes from shiny donuts in the Mega Dimension.
- Sparkling **only applies in Hyperspace** Wild Zones.
- Sparkling **only applies to spawns matching the donut's boosted type**.
- **Lv. 3 forced shiny**: the *first* nearby spawn matching the boosted type in a Hyperspace Wild Zone is forced shiny.
- **Charm does not apply to fossils.**
- Special Scan exceptions (shiny-eligible despite usually-locked legendary status): Latios, Latias, Cobalion, Terrakion, Virizion.
- Shiny-locked: starters, static legendary/mythical battles, NPC gifts, scripted battles.
- Fixed Alpha spawns are **not** static encounters; they remain shiny-eligible.

### 4.3 UI controls (Z-A Mode panel)

- **Encounter mode**: `Wild | Hyperspace Donut | Fossil | Special Scan | Static (locked)`.
- **Shiny Charm** toggle.
- **Sparkling level**: `0 | 1 | 2 | 3`.
- **Donut boosted type**: type selector, only enabled if Sparkling > 0 and mode = Hyperspace Donut.
- **Lv. 3 forced-shiny** explainer banner when Sparkling = 3 + mode = Hyperspace Donut.
- **Fossil exception** banner when mode = Fossil (Charm UI greyed with explainer).
- **Lock warning** when mode = Static.

### 4.4 Output

A single results card with:

- big-number odds (e.g. `1/585.57`)
- `rolls × 1/4096` breakdown
- relevant chips (Donut, Charm, Z-A specific, Locked when applicable)
- list of caveats triggered by the current toggles

---

## 5. Pokemon Scarlet/Violet module

### 5.1 Mechanics encoded

Sources: Serebii, IGN, Game8, VGC; IGN cites Anubis/Sibuna datamine for odds.

| condition                                                | odds      |
|----------------------------------------------------------|-----------|
| Wild base                                                | 1/4096    |
| Shiny Charm                                              | 1/1365.67 |
| Mass Outbreak, 60+ cleared                               | 1/1365.67 |
| Outbreak 60+ + Charm                                     | 1/819.60  |
| Sparkling Power Lv. 3 (sandwich)                         | 1/1024.38 |
| Sandwich Lv. 3 + Charm                                   | 1/683.08  |
| Sandwich Lv. 3 + Outbreak 60+                            | 1/683.08  |
| Sandwich Lv. 3 + Outbreak 60+ + Charm                    | 1/512.44  |
| Breeding base                                            | 1/4096    |
| Breeding + Charm                                         | 1/2048    |
| Masuda                                                   | 1/683     |
| Masuda + Charm                                           | 1/512     |

### 5.2 Behavioral rules

- Sparkling Power **only affects wild encounters** (does not affect eggs).
- Sandwich meal powers last **30 minutes**.
- Best stack for wild: Outbreak 60+ + Sparkling Lv. 3 + Charm = **~1/512**.
- Sandwich planning should also model **Encounter Power** if isolated-encounter strategy is in play.
- **Let's Go mode** does not auto-attack shiny Pokemon, useful for spotting subtle shinies. Surface as a tip card.

### 5.3 SV Sparkling Power Lv. 3 fewest-ingredient recipes (Game8)

| type     | primary ingredient    | flavor             |
|----------|----------------------|--------------------|
| Normal   | Tofu                 | Salty + Sour       |
| Fighting | Pickle               | Salty x2           |
| Flying   | Prosciutto           | Salty x2           |
| Poison   | Green Bell Pepper    | Salty + Spicy      |
| Ground   | Ham                  | Salty x2           |
| Rock     | Bacon                | Salty + Sour       |
| Bug      | Cherry Tomatoes      | Salty x2           |
| Ghost    | Red Onion            | Salty x2           |
| Steel    | Hamburger            | Salty + Sweet      |
| Fire     | Red Bell Pepper      | Salty + Spicy      |
| Water    | Cucumber             | Salty x2           |
| Grass    | Lettuce              | Salty + Sour       |
| Electric | Yellow Bell Pepper   | Salty + Spicy      |
| Psychic  | Onion                | Salty x2           |
| Ice      | Klawf Stick          | Salty x2           |
| Dragon   | Avocado              | Salty x2           |
| Dark     | Smoked Fillet        | Salty + Sweet      |
| Fairy    | Tomato               | Salty x2           |

These are the simplest known one-primary-ingredient routes to Sparkling Power Lv. 3. Players commonly chain a Herba Mystica with this primary; the prototype lists primary + flavor and credits Game8.

### 5.4 UI controls (SV Mode panel)

- **Encounter mode**: `Wild | Mass Outbreak | Sandwich isolated | Breeding`.
- **Shiny Charm** toggle.
- **Sparkling Power Lv. 3** toggle (sandwich).
- **Sandwich target type** selector (only when sandwich on).
- **Outbreak count**: `0 | 30+ | 60+`.
- **Breeding** subpanel with **Masuda** toggle (Masuda implies parents from foreign games; explainer banner). Sandwich is force-disabled when mode = Breeding.
- **Recipe card** by selected type with primary ingredient + flavor + 30 min timer note + Game8 attribution.

### 5.5 Output

Same shape as ZA: big-number odds, chip row, breakdown, caveats.

---

## 6. Dex Tracker view

- Per-species rows with status: `Needed | Hunting | Caught | Locked`.
- Filters: status, game, type, locked-only, hunting-only.
- Counts: `caught/total` overall and per game.
- Persisted to localStorage under `shinyops:tracker:v1`.
- "Mark all locked" bulk action when a game with many static locks is selected.

---

## 7. Persistence

A single localStorage namespace: `shinyops:`.

Keys:

- `shinyops:games:v1` — owned-game ids
- `shinyops:charms:v1` — charm flags per game
- `shinyops:tracker:v1` — `{ [speciesId]: { status, gameId, notes, updated } }`
- `shinyops:za:v1` — last-used ZA panel state
- `shinyops:sv:v1` — last-used SV panel state

Schema-versioned suffixes (`:v1`) so future migrations can be additive.

---

## 8. MVP scope (what's in the prototype)

In:

- Vite + React + TS scaffold
- `data/` files for games, categories, ZA mechanics, SV mechanics, SV recipes, base methods
- `data/generated/pokemon.ts` (full National Dex, produced by `npm run sync:pokemon`)
- `data/species.ts` curated overlay for lock rules, fossils, scan exceptions, per-game availability
- `lib/odds.ts` + table-driven tests
- `lib/pokeapi.ts` PokeAPI response normalizer + tests
- `scripts/sync-pokemon.mjs` ingestion script with disk cache and `--limit` flag
- Tabs: Calculator, Z-A Mode, SV Mode, Dex Tracker - all sprite-aware with graceful fallback
- localStorage persistence
- Legend chips
- Mobile-friendly responsive layout
- README with sources + caveats + legal policy

Out (post-MVP):

- Encounter Power modeling beyond a banner
- Older-gen mechanics (DexNav, PokeRadar, SOS, dynamax adventures) - stubs only
- Server-side sync / accounts
- i18n
- Animated/3D model rendering, cries, move data

---

## 9. Sources

- RotomLabs — Pokemon Legends: Z-A shiny rates page (Anubis/Sibuna datamine).
- IGN — Z-A and SV shiny mechanics writeups (cites Anubis/Sibuna).
- Serebii — game-by-game shiny odds reference.
- Game8 — SV Sparkling Power Lv. 3 fewest-ingredient recipe tables.
- Bulbapedia — historical odds and Masuda math.

URLs are stored on each `Method` and `Recipe` record so anything user-facing has a citation.

---

## 10. Caveats (prototype)

- Odds are derived from community datamines; first-party odds are not published.
- Sparkling Power Lv. 3 forced-first-shiny (Z-A) is asserted by datamine and not officially confirmed.
- ZA fossil charm-exclusion is the consensus reading of the data; treat as best-known until first-party confirms.
- Recipes are the simplest known route per type; many other Lv. 3 paths exist.
- Locked-species lists are the consensus from launch-window community testing.

---

## 11. Dex ingestion and source policy

### 11.1 What ingestion produces

`npm run sync:pokemon` runs `scripts/sync-pokemon.mjs` and writes a single generated file at `src/data/generated/pokemon.ts`. The file exports an array `generatedPokemon: GeneratedPokemon[]` with one row per species (or form) returned by PokeAPI.

```ts
type GeneratedPokemon = {
  id: string;            // 'pikachu', matches PokeAPI slug
  dexNumber: number;     // National Dex number
  name: string;          // display-cased
  types: PokeType[];
  sprites: {
    default?: string;
    shiny?: string;
    artwork?: string;
    artworkShiny?: string;
  };
};
```

Forms / regional variants come through as additional ids when PokeAPI exposes them as distinct `pokemon` resources (e.g. `deoxys-attack`, `wormadam-trash`). Mega and Gigantamax variants are excluded by default to keep the dataset focused on shiny-huntable forms; the script accepts `--include-megas` to opt in.

### 11.2 Fair use of PokeAPI

PokeAPI (pokeapi.co) is a free, open, GET-only API that explicitly asks consumers to be fair: cache results, avoid hammering, prefer batch over loops. The script complies as follows:

- **Sequential or low-concurrency fetches.** Default concurrency is 4. Configurable via `--concurrency`.
- **Disk cache** under `.cache/pokeapi/` keyed by URL. Re-runs reuse cached JSON. The cache directory is gitignored so it doesn't bloat the repo.
- **`--limit N`** flag for partial runs. Useful during dev so the full ~1300-record fetch isn't repeated.
- **`--force`** flag bypasses the cache for a specific URL pattern when an upstream record is suspected stale.
- The script logs progress and never retries indefinitely on a failed fetch; it skips the offender and reports it at the end.

### 11.3 Source-of-truth and legal policy

Two distinct kinds of data with different policies:

**Mechanic data** (rolls per condition, roll math, recipe primary ingredients, lock rules, fossil-charm exclusion, scan exceptions) is hand-curated in `src/data/za.ts`, `src/data/sv.ts`, `src/data/methods.ts`, `src/data/species.ts`. It is sourced from RotomLabs, IGN, Serebii, Game8, Bulbapedia, and is plain text fact citation. Each method/recipe record carries source URLs.

**Bulk dex data** (names, dex numbers, types, sprite URLs) comes from PokeAPI via the ingestion script. PokeAPI's terms permit programmatic GET access for personal/prototype use. The `pokemon` and `pokemon-species` endpoints are used.

**Sprite imagery is third-party IP.** PokeAPI redistributes sprite URLs that point at images owned by Nintendo, The Pokemon Company, and Game Freak. Availability through PokeAPI is **not** a license to redistribute. Therefore:

- The repository **does not vendor** sprite images. We never `wget` them into `public/` or `src/assets/`.
- The generated TS file stores sprite **URLs only**. The browser fetches them at render time from PokeAPI's sprite CDN.
- The README and a UI-level attribution line credit Nintendo / TPC / Game Freak for the imagery and PokeAPI for the data plumbing.
- A future `--cache-sprites` opt-in could write images locally for offline dev, but is **not enabled by default** and any cache directory it produces must be gitignored. The default sync command never touches local image assets.

This policy means the prototype works for personal / educational / portfolio use without distributing copyrighted assets in the source tree. If ShinyOps ever ships commercially, sprite imagery would need to be replaced with licensed art or removed.

### 11.3a Sprite provider chain

The `<Sprite>` component does not read PokeAPI fields directly. It builds an ordered list of candidate URLs from a provider chain, then tries them via `onError` fallback. The chain is implemented in `src/lib/sprite-providers.ts` and the slug rules are isolated in `src/lib/sprite-naming.ts`.

Variants:

- `default` - non-shiny still
- `shiny` - shiny still or animated, prefer animated
- `artwork` - large official artwork
- `animatedShiny` - Showdown GIF, falling through to the shiny still chain

Provider priority for `shiny`:

1. **Local override** (`src/data/sprite-overrides.ts`). URL only. We never vendor sprite images.
2. **Pokemon Showdown** animated shiny GIF: `https://play.pokemonshowdown.com/sprites/ani-shiny/<slug>.gif`. Slug rule: lowercase ascii, hyphens stripped (`mr-mime` → `mrmime`, `nidoran-f` → `nidoranf`).
3. **PokeAPI** `sprites.shiny` from the generated dex.
4. **PokemonDB HOME**: `https://img.pokemondb.net/sprites/home/shiny/<slug>.png`. Slug keeps hyphens; regional suffixes are renamed (`alola` → `alolan`, `galar` → `galarian`, `hisui` → `hisuian`, `paldea` → `paldean`).
5. **Serebii** (opt-in only via the `includeSerebii` option): `https://www.serebii.net/Shiny/SWSH/<dex3>.png`. Coverage and sizing across gens is inconsistent, so the default chain skips it.
6. **PokeAPI artwork** (shiny then non-shiny) as a graceful fallback.
7. **Initial-letter avatar** fallback rendered by `<Sprite>` itself.

Provider priority for `default`: local override → PokeAPI default → PokemonDB HOME → artwork.

Why URL-based, not vendored:

- Sprite imagery is owned by Nintendo / TPC / Game Freak (see §11.3). Availability through these public CDNs is not a redistribution license. URLs are facts; PNG bytes in our repo are unauthorized copies.
- The original SkywardTARDIS/PokemonShinyGuide repo vendored a subset of GIFs for Paldea / special cases. We reference their provider ordering but explicitly do not copy any of their assets.
- A user can opt into a small offline cache for dev via `node scripts/cache-sprites.mjs --provider <name> --limit <N>`. The cache directory (`public/sprites/cache/`) is gitignored and the script refuses to run without explicit flags.

Slug edge cases handled by `slugify*` helpers and unit tests:

- apostrophes: `Farfetch'd` → `farfetchd` / `farfetchd`
- periods: `Mr. Mime` → `mr-mime` / `mrmime`, `Mime Jr.` → `mime-jr` / `mimejr`
- colons: `Type: Null` → `type-null` / `typenull`
- gender symbols: `Nidoran♀` → `nidoran-f` / `nidoranf`
- accents: `Flabébé` → `flabebe`
- compound forms: `Jangmo-o`, `Hakamo-o`, `Kommo-o` keep their internal hyphen for PokeAPI/PokemonDB, lose it for Showdown
- regional / form variants: `raichu-alola` (PokeAPI) → `raichualola` (Showdown) / `raichu-alolan` (PokemonDB)
- Basculin white-striped: `basculin-white-striped` → `basculinwhitestriped` / unchanged for PokemonDB

Anything that doesn't fit a generic rule gets a typed entry in `sprite-overrides.ts`; we keep regex out of the React component.

### 11.4 Failure modes and graceful degradation

- If `src/data/generated/pokemon.ts` is missing, the app boots from the curated overlay alone (~30 species). Search still works; sprites simply render as initial-letter avatars.
- If a sprite URL 404s, the `<Sprite>` component falls back to the avatar treatment. No layout jank.
- If PokeAPI is offline at sync time, cached responses are reused. If both fail, the script exits non-zero and leaves the previous generated file untouched.

### 11.5 npm scripts

- `npm run sync:pokemon` - full default sync (large; cache-warm).
- `npm run sync:pokemon -- --limit 30` - dev-friendly subset.
- `npm run sync:pokemon -- --limit 151` - Kanto-only.
- `npm run sync:pokemon -- --concurrency 2` - politer fetch.
- `npm run cache:sprites -- --provider pokeapi --limit 3 --dry-run` - opt-in sprite cache (see §11.3a).

The script is idempotent: re-running with the same args produces the same generated file.
