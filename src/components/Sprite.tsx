import { useEffect, useMemo, useState } from 'react';
import type { Species } from '../lib/types';
import { buildSpriteCandidates, type SpriteVariant } from '../lib/sprite-providers';

interface SpriteProps {
  species: Species;
  size?: number;
  variant?: SpriteVariant;
  includeSerebii?: boolean;
}

function initialFor(s: Species): string {
  return s.name?.[0]?.toUpperCase() ?? '?';
}

export function Sprite({ species, size = 56, variant = 'default', includeSerebii = false }: SpriteProps) {
  const candidates = useMemo(
    () => buildSpriteCandidates(species, { variant, includeSerebii }),
    [species, variant, includeSerebii],
  );

  const [idx, setIdx] = useState(0);
  // Reset to the first candidate whenever the candidate list changes (different
  // species, variant, etc.) so we don't keep skipping based on a stale index.
  useEffect(() => {
    setIdx(0);
  }, [candidates]);

  const current = candidates[idx];

  if (!current) {
    return (
      <div
        className="sprite-fallback"
        style={{ width: size, height: size }}
        aria-label={`${species.name} avatar`}
        data-sprite-provider="fallback"
      >
        <span>{initialFor(species)}</span>
        <span className="dex-mini">#{String(species.dexNumber).padStart(4, '0')}</span>
      </div>
    );
  }

  const shinyVariant = variant === 'shiny' || variant === 'animatedShiny';

  return (
    <img
      src={current.url}
      alt={`${species.name}${shinyVariant ? ' (shiny)' : ''}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="sprite"
      style={{ width: size, height: size }}
      title={`${species.name} - ${current.provider}`}
      data-sprite-provider={current.provider}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
