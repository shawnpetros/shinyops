#!/usr/bin/env node
/*
 * Pull species/sprite metadata from PokeAPI and emit src/data/generated/pokemon.ts.
 *
 * Fair use: caches every GET under .cache/pokeapi, defaults to concurrency 4,
 * and only stores URLs - never downloads sprite images.
 *
 * Usage:
 *   node scripts/sync-pokemon.mjs
 *   node scripts/sync-pokemon.mjs --limit 30
 *   node scripts/sync-pokemon.mjs --concurrency 2
 *   node scripts/sync-pokemon.mjs --include-megas
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CACHE_DIR = join(ROOT, '.cache', 'pokeapi');
const OUT_PATH = join(ROOT, 'src', 'data', 'generated', 'pokemon.ts');
const AVAILABILITY_OUT_PATH = join(ROOT, 'src', 'data', 'generated', 'availability.ts');

const POKEAPI = 'https://pokeapi.co/api/v2';

// Game id (as defined in src/data/games.ts) → PokeAPI pokedex slugs whose union
// approximates the catchable species set in that game. Source: pokeapi.co/api/v2/pokedex.
// Caveat: PokeAPI's extended-sinnoh is the Platinum regional dex; BDSP's Grand
// Underground / Ramanas Park additions are not represented and need curated overlay.
const POKEDEX_BY_GAME = {
  za: ['lumiose-city', 'hyperspace'],
  sv: ['paldea', 'kitakami', 'blueberry'],
  la: ['hisui'],
  bdsp: ['extended-sinnoh'],
  sw: ['galar', 'isle-of-armor', 'crown-tundra'],
  sh: ['galar', 'isle-of-armor', 'crown-tundra'],
};

const VALID_TYPES = new Set([
  'normal', 'fighting', 'flying', 'poison', 'ground',
  'rock', 'bug', 'ghost', 'steel', 'fire',
  'water', 'grass', 'electric', 'psychic', 'ice',
  'dragon', 'dark', 'fairy',
]);

function parseArgs(argv) {
  const args = { limit: null, concurrency: 4, includeMegas: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else if (a === '--include-megas') args.includeMegas = true;
    else if (a === '--force') args.force = true;
  }
  if (Number.isNaN(args.limit)) args.limit = null;
  if (Number.isNaN(args.concurrency) || args.concurrency < 1) args.concurrency = 4;
  return args;
}

function cachePathFor(url) {
  const safe = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  return join(CACHE_DIR, `${safe}.json`);
}

async function fileExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url, { force }) {
  const cachePath = cachePathFor(url);
  if (!force && (await fileExists(cachePath))) {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'shinyops-sync/0.1 (personal use)' } });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const json = await res.json();
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(json));
  return json;
}

function shouldKeepForm(slug, includeMegas) {
  const parts = slug.split('-');
  if (!includeMegas && (parts.includes('mega') || parts.includes('gmax'))) return false;
  if (parts.includes('totem')) return false;
  if (parts.includes('cap')) return false;
  return true;
}

function displayName(slug) {
  return slug
    .split('-')
    .map((p) => (p.length === 0 ? p : p[0].toUpperCase() + p.slice(1)))
    .join(' ');
}

function normalize(raw, dexNumber) {
  const types = (raw.types ?? [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)
    .filter((t) => VALID_TYPES.has(t));

  const sprites = {};
  const front = raw.sprites?.front_default;
  const shiny = raw.sprites?.front_shiny;
  const artwork = raw.sprites?.other?.['official-artwork']?.front_default;
  const artworkShiny = raw.sprites?.other?.['official-artwork']?.front_shiny;
  if (front) sprites.default = front;
  if (shiny) sprites.shiny = shiny;
  if (artwork) sprites.artwork = artwork;
  if (artworkShiny) sprites.artworkShiny = artworkShiny;

  const speciesId = raw.species?.name;
  const row = {
    id: raw.name,
    dexNumber,
    name: displayName(raw.name),
    types,
    sprites,
  };
  if (speciesId && speciesId !== raw.name) row.speciesId = speciesId;
  return row;
}

async function fetchPokedex(slug, force) {
  const url = `${POKEAPI}/pokedex/${slug}`;
  const data = await fetchJson(url, { force });
  return (data.pokemon_entries ?? [])
    .map((e) => e.pokemon_species?.name)
    .filter(Boolean);
}

async function buildAvailability(args) {
  // Union all unique pokedex slugs across games, fetch each once, then
  // invert: speciesId → list of game ids whose pokedex contains it.
  const allSlugs = new Set();
  for (const slugs of Object.values(POKEDEX_BY_GAME)) {
    for (const s of slugs) allSlugs.add(s);
  }
  const slugList = [...allSlugs];
  console.log(`[sync-pokemon] fetching ${slugList.length} pokedex resources`);
  const slugMembers = {};
  for (const slug of slugList) {
    slugMembers[slug] = new Set(await fetchPokedex(slug, args.force));
  }

  const availability = {};
  for (const [gameId, slugs] of Object.entries(POKEDEX_BY_GAME)) {
    const speciesForGame = new Set();
    for (const s of slugs) {
      for (const sp of slugMembers[s] ?? []) speciesForGame.add(sp);
    }
    for (const sp of speciesForGame) {
      if (!availability[sp]) availability[sp] = [];
      availability[sp].push(gameId);
    }
  }
  // sort game ids deterministically per species
  for (const sp of Object.keys(availability)) availability[sp].sort();
  return availability;
}

function emitAvailabilityTs(availability) {
  const sorted = Object.fromEntries(
    Object.entries(availability).sort(([a], [b]) => a.localeCompare(b)),
  );
  const header = `// AUTO-GENERATED by scripts/sync-pokemon.mjs - DO NOT EDIT.\n// Source: PokeAPI pokedex resources. Maps speciesId -> list of game ids whose\n// regional dex contains the species. See SPEC.md §11 + sync-pokemon.mjs for\n// the game→pokedex mapping and known coverage gaps (BDSP underground).\n\nimport type { GameId } from '../../lib/types';\n\nexport const availabilityBySpecies: Record<string, GameId[]> = ${tsLiteral(sorted)} as Record<string, GameId[]>;\n`;
  return header;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch (err) {
        results[idx] = { error: err };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function tsLiteral(value) {
  return JSON.stringify(value);
}

function emitTs(rows) {
  const header = `// AUTO-GENERATED by scripts/sync-pokemon.mjs - DO NOT EDIT.\n// Source: PokeAPI (pokeapi.co). Sprite URLs reference imagery owned by\n// Nintendo / The Pokemon Company / Game Freak; see SPEC.md §11 for policy.\n\nimport type { GeneratedPokemon } from '../../lib/pokeapi';\n\n// Cast via unknown: at ~1200 rows the inferred literal union exceeds TS's\n// representable-type budget. Runtime shape is enforced by GeneratedPokemon.\nexport const generatedPokemon: GeneratedPokemon[] = ${tsLiteral(rows)} as unknown as GeneratedPokemon[];\n`;
  return header;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[sync-pokemon] limit=${args.limit ?? 'all'} concurrency=${args.concurrency} includeMegas=${args.includeMegas}`);

  await mkdir(CACHE_DIR, { recursive: true });

  const indexLimit = args.limit ?? 1500;
  const indexUrl = `${POKEAPI}/pokemon?limit=${indexLimit}`;
  const index = await fetchJson(indexUrl, { force: args.force });
  console.log(`[sync-pokemon] index has ${index.results.length} entries`);

  const filtered = index.results.filter((r) => shouldKeepForm(r.name, args.includeMegas));
  const targets = args.limit != null ? filtered.slice(0, args.limit) : filtered;
  console.log(`[sync-pokemon] fetching ${targets.length} pokemon`);

  let done = 0;
  const failures = [];
  const fetched = await mapWithConcurrency(targets, args.concurrency, async (entry) => {
    try {
      const raw = await fetchJson(entry.url, { force: args.force });
      done += 1;
      if (done % 25 === 0 || done === targets.length) {
        console.log(`[sync-pokemon] ${done}/${targets.length}`);
      }
      return raw;
    } catch (err) {
      failures.push({ name: entry.name, err: String(err) });
      return null;
    }
  });

  const rows = [];
  for (const raw of fetched) {
    if (!raw || raw.error) continue;
    if (typeof raw.id !== 'number' || typeof raw.name !== 'string') continue;
    rows.push(normalize(raw, raw.id));
  }
  rows.sort((a, b) => a.dexNumber - b.dexNumber || a.id.localeCompare(b.id));

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, emitTs(rows));
  console.log(`[sync-pokemon] wrote ${rows.length} rows to ${OUT_PATH}`);

  const availability = await buildAvailability(args);
  await writeFile(AVAILABILITY_OUT_PATH, emitAvailabilityTs(availability));
  console.log(
    `[sync-pokemon] wrote ${Object.keys(availability).length} availability rows to ${AVAILABILITY_OUT_PATH}`,
  );

  if (failures.length > 0) {
    console.warn(`[sync-pokemon] ${failures.length} failures:`);
    for (const f of failures.slice(0, 10)) console.warn(`  - ${f.name}: ${f.err}`);
    if (failures.length > 10) console.warn(`  ...and ${failures.length - 10} more`);
  }
}

main().catch((err) => {
  console.error('[sync-pokemon] fatal:', err);
  process.exit(1);
});
