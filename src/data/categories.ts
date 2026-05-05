import type { Category } from '../lib/types';

export const categories: Category[] = [
  {
    id: 'base',
    emoji: '✨',
    label: 'Base odds',
    description: 'Vanilla 1/4096 (or game default) with no boosts applied.',
    colorVar: '--chip-base',
  },
  {
    id: 'charm',
    emoji: '🧲',
    label: 'Charm boosted',
    description: 'Requires the Shiny Charm key item.',
    colorVar: '--chip-charm',
  },
  {
    id: 'chain',
    emoji: '🔁',
    label: 'Chain / streak',
    description: 'DexNav, Catch Combo, PokeRadar, etc.',
    colorVar: '--chip-chain',
  },
  {
    id: 'sandwich',
    emoji: '🥪',
    label: 'Sandwich / food',
    description: 'Scarlet/Violet Sparkling Power.',
    colorVar: '--chip-sandwich',
  },
  {
    id: 'donut',
    emoji: '🍩',
    label: 'Donut / food',
    description: 'Pokemon Legends: Z-A Sparkling Power donuts.',
    colorVar: '--chip-donut',
  },
  {
    id: 'outbreak',
    emoji: '🗺️',
    label: 'Outbreak / spawn',
    description: 'SV mass outbreaks, SwSh dynamax adventures.',
    colorVar: '--chip-outbreak',
  },
  {
    id: 'masuda',
    emoji: '🧬',
    label: 'Masuda / breeding',
    description: 'Egg-based hunts with foreign-game parents.',
    colorVar: '--chip-masuda',
  },
  {
    id: 'za-specific',
    emoji: '🏙️',
    label: 'Z-A specific',
    description: 'Hyperspace, special scan, fossil exception.',
    colorVar: '--chip-za',
  },
  {
    id: 'locked',
    emoji: '🚫',
    label: 'Shiny locked',
    description: 'Not eligible regardless of method or boosts.',
    colorVar: '--chip-locked',
  },
];

export const categoryById = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<Category['id'], Category>;
