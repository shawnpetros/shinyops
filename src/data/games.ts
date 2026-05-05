import type { Game } from '../lib/types';

export const games: Game[] = [
  {
    id: 'za',
    name: 'Pokemon Legends: Z-A',
    shortName: 'Z-A',
    era: 'gen9',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'donut', 'specialScan', 'fossil', 'wild'],
    releaseYear: 2025,
  },
  {
    id: 'sv',
    name: 'Pokemon Scarlet/Violet',
    shortName: 'SV',
    era: 'gen9',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'sandwich', 'massOutbreak', 'masuda', 'breeding', 'wild'],
    releaseYear: 2022,
  },
  {
    id: 'la',
    name: 'Pokemon Legends: Arceus',
    shortName: 'PLA',
    era: 'gen8.5',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'massOutbreak', 'wild'],
    releaseYear: 2022,
  },
  {
    id: 'bdsp',
    name: 'Brilliant Diamond / Shining Pearl',
    shortName: 'BDSP',
    era: 'gen8',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'masuda', 'breeding', 'wild'],
    releaseYear: 2021,
  },
  {
    id: 'sw',
    name: 'Pokemon Sword',
    shortName: 'SwSh',
    era: 'gen8',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'masuda', 'breeding', 'wild'],
    releaseYear: 2019,
  },
  {
    id: 'sh',
    name: 'Pokemon Shield',
    shortName: 'SwSh',
    era: 'gen8',
    platform: 'switch',
    supportedMechanics: ['shinyCharm', 'masuda', 'breeding', 'wild'],
    releaseYear: 2019,
  },
];

export const gameById = Object.fromEntries(games.map((g) => [g.id, g])) as Record<
  Game['id'],
  Game
>;
