import { useEffect, useState } from 'react';
import {
  computeZARolls,
  rollsToOdds,
  ZA_NOTES,
  ZA_SOURCES,
  type SparklingLevel,
  type ZAMode,
  type ZAState,
} from '../data/za';
import { load, save } from '../lib/storage';
import type { CategoryId, PokeType } from '../lib/types';
import { ChipRow } from './Chip';

const MODES: { id: ZAMode; label: string }[] = [
  { id: 'wild', label: 'Wild' },
  { id: 'hyperspace', label: 'Hyperspace donut' },
  { id: 'fossil', label: 'Fossil' },
  { id: 'scan', label: 'Special Scan' },
  { id: 'static', label: 'Static (locked)' },
];

const SPARKLING: { id: SparklingLevel; label: string }[] = [
  { id: 0, label: 'Off' },
  { id: 1, label: 'Lv. 1' },
  { id: 2, label: 'Lv. 2' },
  { id: 3, label: 'Lv. 3' },
];

const TYPES: PokeType[] = [
  'normal', 'fighting', 'flying', 'poison', 'ground',
  'rock', 'bug', 'ghost', 'steel', 'fire',
  'water', 'grass', 'electric', 'psychic', 'ice',
  'dragon', 'dark', 'fairy',
];

const STORAGE_KEY = 'za:v1';

const DEFAULT_STATE: ZAState = {
  mode: 'wild',
  shinyCharm: false,
  sparkling: 0,
};

function chipsFor(state: ZAState): CategoryId[] {
  const chips: CategoryId[] = [];
  if (state.mode === 'static') chips.push('locked');
  if (state.mode === 'fossil') chips.push('za-specific', 'base');
  if (state.mode === 'scan') chips.push('za-specific');
  if (state.mode === 'hyperspace' && state.sparkling > 0) chips.push('donut', 'za-specific');
  if (state.shinyCharm && state.mode !== 'fossil' && state.mode !== 'static') chips.push('charm');
  if (chips.length === 0) chips.push('base');
  return chips;
}

export function ZAModule() {
  const [state, setState] = useState<ZAState>(() => load(STORAGE_KEY, DEFAULT_STATE));

  useEffect(() => {
    save(STORAGE_KEY, state);
  }, [state]);

  const { rolls, caveats } = computeZARolls(state);
  const odds = rollsToOdds(rolls);

  return (
    <div className="card">
      <h2>🏙️ Pokemon Legends: Z-A</h2>
      <p className="muted">Hyperspace donuts, special scans, and the fossil charm-exception.</p>

      <div className="grid cols-2">
        <div className="col">
          <span className="subtle">Encounter mode</span>
          <div className="row">
            {MODES.map((m) => (
              <button
                key={m.id}
                className="toggle"
                aria-pressed={state.mode === m.id}
                onClick={() => setState({ ...state, mode: m.id })}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="divider" />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={state.shinyCharm}
              onChange={(e) => setState({ ...state, shinyCharm: e.target.checked })}
            />
            <strong>Shiny Charm</strong>{' '}
            <span className="subtle">+3 rolls (no effect on fossils or static)</span>
          </label>

          <span className="subtle" style={{ marginTop: 8 }}>
            Sparkling Power (donut)
          </span>
          <div className="row">
            {SPARKLING.map((s) => (
              <button
                key={s.id}
                className="toggle"
                aria-pressed={state.sparkling === s.id}
                onClick={() => setState({ ...state, sparkling: s.id })}
                disabled={state.mode !== 'hyperspace' && s.id !== 0}
              >
                {s.label}
              </button>
            ))}
          </div>

          {state.mode === 'hyperspace' && state.sparkling > 0 && (
            <>
              <span className="subtle" style={{ marginTop: 8 }}>
                Donut boosted type
              </span>
              <select
                value={state.donutType ?? ''}
                onChange={(e) => setState({ ...state, donutType: e.target.value || undefined })}
              >
                <option value="">- pick a type -</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="col">
          <div
            style={{
              padding: 16,
              background: 'var(--bg-elev-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="big-odds">
              {odds.oddsLabel}
              <span className="small">
                {rolls > 0 ? `${rolls} roll${rolls === 1 ? '' : 's'} × 1/4096` : 'shiny locked'}
              </span>
            </div>
            <div style={{ marginTop: 10 }}>
              <ChipRow ids={chipsFor(state)} />
            </div>
            {odds.per1000 > 0 && (
              <p className="subtle" style={{ marginTop: 8 }}>
                Roughly {odds.per1000.toFixed(2)} shinies per 1000 spawns.
              </p>
            )}
          </div>

          {state.mode === 'static' && <div className="callout warn">{ZA_NOTES.staticLocked}</div>}
          {state.mode === 'fossil' && <div className="callout warn">{ZA_NOTES.fossilCharm}</div>}
          {state.mode === 'scan' && <div className="callout info">{ZA_NOTES.scanExceptions}</div>}
          {state.mode === 'hyperspace' && state.sparkling === 3 && (
            <div className="callout">{ZA_NOTES.forcedLv3}</div>
          )}
          {caveats
            .filter((c) => !Object.values(ZA_NOTES).includes(c))
            .map((c, i) => (
              <div className="callout info" key={i}>
                {c}
              </div>
            ))}
        </div>
      </div>

      <div className="divider" />
      <p className="subtle">
        Sources:{' '}
        {ZA_SOURCES.map((s, i) => (
          <span key={s}>
            {i > 0 && ', '}
            <a href={s} target="_blank" rel="noreferrer">
              {new URL(s).hostname}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
