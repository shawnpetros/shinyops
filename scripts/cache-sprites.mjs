#!/usr/bin/env node
/*
 * Optional offline sprite cache.
 *
 * Reads the generated PokeAPI dataset and downloads selected provider URLs
 * into public/sprites/cache. Default behavior is INTENTIONALLY restrictive:
 *
 *   - You must pass --provider <name> AND --limit <N>.
 *   - --provider supports: pokeapi | pokeapi-shiny | pokemondb-home-shiny | showdown-ani-shiny
 *   - The cache directory is gitignored. We never commit downloaded sprites.
 *   - Sprite imagery is owned by Nintendo / The Pokemon Company / Game Freak;
 *     this is for offline dev only. See SPEC.md §11.
 *
 * Usage:
 *   node scripts/cache-sprites.mjs --provider pokeapi --limit 3
 *   node scripts/cache-sprites.mjs --provider pokeapi-shiny --limit 30
 *   node scripts/cache-sprites.mjs --provider showdown-ani-shiny --limit 10 --dry-run
 *   node scripts/cache-sprites.mjs --help
 */

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const POKEMON_TS = join(ROOT, 'src', 'data', 'generated', 'pokemon.ts');
const CACHE_DIR = join(ROOT, 'public', 'sprites', 'cache');

const SUPPORTED_PROVIDERS = new Set([
  'pokeapi',
  'pokeapi-shiny',
  'pokemondb-home-shiny',
  'showdown-ani-shiny',
]);

const HELP = `cache-sprites.mjs - opt-in offline sprite cache

Required flags:
  --provider <name>   one of: ${[...SUPPORTED_PROVIDERS].join(', ')}
  --limit <N>         number of species to fetch (must be >= 1)

Optional flags:
  --concurrency <N>   default 2; keep this low to be polite to remote hosts
  --dry-run           print URLs without downloading
  --force             overwrite cached files

Note: cached sprites are gitignored and IP-sensitive. Do not commit them.
`;

function parseArgs(argv) {
  const args = { provider: null, limit: null, concurrency: 2, dryRun: false, force: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--provider') args.provider = argv[++i];
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10);
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

async function fileExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function loadGenerated() {
  // The generated file is plain JS we control - import it dynamically so we
  // pick up whatever was last produced by sync-pokemon.mjs.
  const mod = await import(POKEMON_TS).catch(() => null);
  if (mod?.generatedPokemon) return mod.generatedPokemon;
  // Fallback: parse the JSON literal between `= ` and ` as`.
  const { readFile } = await import('node:fs/promises');
  const txt = await readFile(POKEMON_TS, 'utf8');
  const start = txt.indexOf('[');
  const end = txt.lastIndexOf(']');
  if (start < 0 || end < 0) throw new Error('cannot parse generated pokemon.ts');
  return JSON.parse(txt.slice(start, end + 1));
}

function showdownSlug(pokeapiSlug) {
  return pokeapiSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const POKEMONDB_RENAMES = { alola: 'alolan', galar: 'galarian', hisui: 'hisuian', paldea: 'paldean' };
function pokemondbSlug(pokeapiSlug) {
  const cleaned = pokeapiSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const parts = cleaned.split('-');
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (POKEMONDB_RENAMES[last]) parts[parts.length - 1] = POKEMONDB_RENAMES[last];
  }
  return parts.join('-');
}

function urlFor(provider, row) {
  switch (provider) {
    case 'pokeapi':
      return row.sprites?.default ?? null;
    case 'pokeapi-shiny':
      return row.sprites?.shiny ?? null;
    case 'pokemondb-home-shiny':
      return `https://img.pokemondb.net/sprites/home/shiny/${pokemondbSlug(row.id)}.png`;
    case 'showdown-ani-shiny':
      return `https://play.pokemonshowdown.com/sprites/ani-shiny/${showdownSlug(row.id)}.gif`;
    default:
      return null;
  }
}

function localPathFor(provider, row, url) {
  const ext = extname(new URL(url).pathname) || '.png';
  return join(CACHE_DIR, provider, `${row.id}${ext}`);
}

async function downloadOne({ row, provider, url, args }) {
  const out = localPathFor(provider, row, url);
  if (!args.force && (await fileExists(out))) return { row, status: 'cached' };
  if (args.dryRun) return { row, status: 'dry-run', url };
  const res = await fetch(url, { headers: { 'User-Agent': 'shinyops-cache/0.1 (personal use)' } });
  if (!res.ok) return { row, status: `http-${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);
  return { row, status: 'wrote', size: buf.length };
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
        results[idx] = { error: String(err) };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (!args.provider || !SUPPORTED_PROVIDERS.has(args.provider)) {
    console.error('error: --provider is required and must be one of:', [...SUPPORTED_PROVIDERS].join(', '));
    console.error('\n' + HELP);
    process.exit(2);
  }
  if (!Number.isFinite(args.limit) || args.limit < 1) {
    console.error('error: --limit <N> is required and must be >= 1');
    console.error('\n' + HELP);
    process.exit(2);
  }
  if (!Number.isFinite(args.concurrency) || args.concurrency < 1) args.concurrency = 2;

  console.log(
    `[cache-sprites] provider=${args.provider} limit=${args.limit} concurrency=${args.concurrency}` +
      (args.dryRun ? ' [dry-run]' : ''),
  );
  console.warn('[cache-sprites] reminder: cached sprite assets are NOT committed (gitignored).');

  const dataset = await loadGenerated();
  const targets = dataset.slice(0, args.limit);
  const tasks = [];
  for (const row of targets) {
    const url = urlFor(args.provider, row);
    if (!url) continue;
    tasks.push({ row, provider: args.provider, url, args });
  }

  if (!args.dryRun) {
    await mkdir(join(CACHE_DIR, args.provider), { recursive: true });
  }

  const results = await mapWithConcurrency(tasks, args.concurrency, downloadOne);
  let wrote = 0, cached = 0, dry = 0, fail = 0;
  for (const r of results) {
    if (!r) continue;
    if (r.status === 'wrote') wrote += 1;
    else if (r.status === 'cached') cached += 1;
    else if (r.status === 'dry-run') {
      dry += 1;
      console.log(`  [dry-run] ${r.row.id} -> ${r.url}`);
    } else fail += 1;
  }
  console.log(`[cache-sprites] wrote=${wrote} cached=${cached} dry-run=${dry} failed=${fail}`);
}

main().catch((err) => {
  console.error('[cache-sprites] fatal:', err);
  process.exit(1);
});
