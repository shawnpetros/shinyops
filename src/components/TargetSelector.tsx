import { useMemo, useState } from 'react';
import { species as allSpecies } from '../data/species';
import type { Species } from '../lib/types';
import { Sprite } from './Sprite';

interface TargetSelectorProps {
  value: Species | null;
  onChange: (s: Species | null) => void;
}

export function TargetSelector({ value, onChange }: TargetSelectorProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSpecies.slice(0, 8);
    return allSpecies
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          String(s.dexNumber).includes(q) ||
          s.types.some((t) => t.includes(q)),
      )
      .slice(0, 12);
  }, [query]);

  return (
    <div className="card">
      <h2>1. Pick your target</h2>
      <p className="muted">
        Search by name, Dex number, or type. Full National Dex from PokeAPI; curated availability
        overlay covers ZA / SV mechanic flags.
      </p>
      <input
        type="search"
        placeholder="e.g. Latios, 380, dragon"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search target species"
      />
      {value && !open && (
        <div style={{ marginTop: 10 }} className="row">
          <Sprite species={value} size={40} />
          <span className="status-pill caught">Selected</span>
          <strong>{value.name}</strong>
          <span className="subtle">#{String(value.dexNumber).padStart(4, '0')}</span>
          <button onClick={() => onChange(null)} style={{ marginLeft: 'auto' }}>
            Clear
          </button>
        </div>
      )}
      {open && (
        <div style={{ marginTop: 10 }} className="col">
          {matches.length === 0 && <span className="subtle">No matches.</span>}
          {matches.map((s) => {
            const gameCount = Object.keys(s.availabilityByGame).length;
            return (
              <button
                key={s.id}
                className="search-result"
                aria-selected={value?.id === s.id}
                onClick={() => {
                  onChange(s);
                  setQuery(s.name);
                  setOpen(false);
                }}
              >
                <span className="search-result-content">
                  <Sprite species={s} size={40} />
                  <span>
                    <span className="dex">#{String(s.dexNumber).padStart(4, '0')}</span>
                    <strong>{s.name}</strong>{' '}
                    <span className="subtle">
                      {s.types.join(' / ')}
                      {gameCount > 0
                        ? ` - in ${gameCount} game${gameCount === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
