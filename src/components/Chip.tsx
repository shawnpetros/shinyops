import { categoryById } from '../data/categories';
import type { CategoryId } from '../lib/types';

interface ChipProps {
  id: CategoryId;
  size?: 'sm' | 'md';
  title?: boolean;
}

export function Chip({ id, size = 'sm', title = true }: ChipProps) {
  const c = categoryById[id];
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? 12 : 13;
  return (
    <span
      title={title ? c.description : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        fontSize,
        borderRadius: 999,
        background: `color-mix(in srgb, var(${c.colorVar}) 18%, transparent)`,
        color: `var(${c.colorVar})`,
        border: `1px solid color-mix(in srgb, var(${c.colorVar}) 45%, transparent)`,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{c.emoji}</span>
      <span>{c.label}</span>
    </span>
  );
}

export function ChipRow({ ids }: { ids: CategoryId[] }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
      {ids.map((id) => (
        <Chip key={id} id={id} />
      ))}
    </span>
  );
}
