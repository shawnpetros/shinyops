import { useEffect, useMemo, useState } from 'react';
import { species as allSpecies } from '../data/species';
import { load, save } from '../lib/storage';
import type { SpeciesStatus, TrackerState } from '../lib/types';
import { Sprite } from './Sprite';

const STORAGE_KEY = 'tracker:v1';

const STATUS_OPTIONS: { id: SpeciesStatus; label: string }[] = [
  { id: 'needed', label: 'Needed' },
  { id: 'hunting', label: 'Hunting' },
  { id: 'caught', label: 'Caught' },
  { id: 'locked', label: 'Locked' },
];

type Filter = 'all' | SpeciesStatus;

export function DexTracker() {
  const [state, setState] = useState<TrackerState>(() => load(STORAGE_KEY, {}));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    save(STORAGE_KEY, state);
  }, [state]);

  const setStatus = (speciesId: string, status: SpeciesStatus) => {
    setState((prev) => ({
      ...prev,
      [speciesId]: { ...prev[speciesId], status, updated: new Date().toISOString() },
    }));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSpecies.filter((s) => {
      const status = state[s.id]?.status ?? 'needed';
      if (filter !== 'all' && status !== filter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !String(s.dexNumber).includes(q)) return false;
      return true;
    });
  }, [filter, query, state]);

  const counts = useMemo(() => {
    const c: Record<SpeciesStatus, number> = { needed: 0, hunting: 0, caught: 0, locked: 0 };
    for (const s of allSpecies) {
      const status = state[s.id]?.status ?? 'needed';
      c[status] += 1;
    }
    return c;
  }, [state]);

  return (
    <div className="card">
      <h2>Dex tracker</h2>
      <p className="muted">
        {counts.caught} caught / {allSpecies.length} total. {counts.hunting} active hunts.{' '}
        {counts.locked} locked.
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        <input
          type="search"
          placeholder="Search species..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        {(['all', ...STATUS_OPTIONS.map((s) => s.id)] as Filter[]).map((f) => (
          <button
            key={f}
            className="toggle"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_OPTIONS.find((s) => s.id === f)?.label}
            {f !== 'all' && <span className="subtle"> ({counts[f]})</span>}
          </button>
        ))}
      </div>

      <ul className="clean">
        {filtered.map((s) => {
          const status: SpeciesStatus = state[s.id]?.status ?? 'needed';
          const games = Object.keys(s.availabilityByGame);
          return (
            <li key={s.id}>
              <div className="species-row">
                <Sprite species={s} size={48} />
                <div className="meta col" style={{ gap: 2 }}>
                  <strong>
                    <span className="dex">#{String(s.dexNumber).padStart(4, '0')}</span> {s.name}
                  </strong>
                  <span className="subtle">
                    {s.types.join(' / ')}
                    {games.length > 0 ? ` - in ${games.join(', ')}` : ''}
                  </span>
                </div>
                <div className="row">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      className={`status-pill ${opt.id}`}
                      style={{
                        opacity: status === opt.id ? 1 : 0.45,
                        cursor: 'pointer',
                        border: status === opt.id ? undefined : '1px solid var(--border)',
                        background: status === opt.id ? undefined : 'transparent',
                      }}
                      onClick={() => setStatus(s.id, opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="subtle">No species match the current filter.</li>}
      </ul>
    </div>
  );
}
