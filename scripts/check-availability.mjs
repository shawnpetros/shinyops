import { speciesById } from '../src/data/species.ts';
const checks = ['dragonite', 'pikachu', 'koraidon', 'arceus', 'sprigatito', 'mew', 'aerodactyl', 'charmander'];
for (const id of checks) {
  const s = speciesById[id];
  if (!s) { console.log(`${id}: MISSING`); continue; }
  const games = Object.entries(s.availabilityByGame)
    .map(([g, a]) => `${g}${a.locked ? '(locked)' : ''}${a.notes ? '*' : ''}`)
    .join(',');
  console.log(`${id.padEnd(12)} ${s.name.padEnd(14)} → ${games || '(none)'}`);
}
