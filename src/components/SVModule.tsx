import { useEffect, useState } from 'react';
import {
  computeSVRolls,
  rollsToOdds,
  recipeByType,
  SV_NOTES,
  SV_SOURCES,
  type OutbreakCount,
  type SVMode,
  type SVState,
} from '../data/sv';
import { load, save } from '../lib/storage';
import type { CategoryId, PokeType } from '../lib/types';
import { ChipRow } from './Chip';

const MODES: { id: SVMode; label: string }[] = [
  { id: 'wild', label: 'Wild' },
  { id: 'outbreak', label: 'Mass outbreak' },
  { id: 'sandwich-isolated', label: 'Sandwich isolated' },
  { id: 'breeding', label: 'Breeding' },
];

const OUTBREAK_OPTIONS: { id: OutbreakCount; label: string }[] = [
  { id: 0, label: '0 cleared' },
  { id: 30, label: '30+' },
  { id: 60, label: '60+' },
];

const TYPES: PokeType[] = [
  'normal', 'fighting', 'flying', 'poison', 'ground',
  'rock', 'bug', 'ghost', 'steel', 'fire',
  'water', 'grass', 'electric', 'psychic', 'ice',
  'dragon', 'dark', 'fairy',
];

const STORAGE_KEY = 'sv:v1';

const DEFAULT_STATE: SVState = {
  mode: 'wild',
  shinyCharm: false,
  sparkling3: false,
  outbreak: 0,
  masuda: false,
};

function chipsFor(state: SVState): CategoryId[] {
  const chips: CategoryId[] = [];
  if (state.mode === 'breeding') {
    chips.push(state.masuda ? 'masuda' : 'base');
  } else {
    if (state.sparkling3) chips.push('sandwich');
    if (state.outbreak >= 30) chips.push('outbreak');
    if (chips.length === 0) chips.push('base');
  }
  if (state.shinyCharm) chips.push('charm');
  return chips;
}

export function SVModule() {
  const [state, setState] = useState<SVState>(() => load(STORAGE_KEY, DEFAULT_STATE));

  useEffect(() => {
    save(STORAGE_KEY, state);
  }, [state]);

  const { rolls, caveats } = computeSVRolls(state);
  const odds = rollsToOdds(rolls);
  const sandwichDisabled = state.mode === 'breeding';
  const recipe = state.sandwichType ? recipeByType[state.sandwichType] : undefined;

  return (
    <div className="card">
      <h2>🥪 Pokemon Scarlet/Violet</h2>
      <p className="muted">Sandwiches, outbreaks, Masuda, and the 1/512 best stack.</p>

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
            <strong>Shiny Charm</strong> <span className="subtle">+2 rolls</span>
          </label>

          {state.mode !== 'breeding' && (
            <>
              <label className="checkbox" style={{ opacity: sandwichDisabled ? 0.4 : 1 }}>
                <input
                  type="checkbox"
                  disabled={sandwichDisabled}
                  checked={state.sparkling3}
                  onChange={(e) => setState({ ...state, sparkling3: e.target.checked })}
                />
                <strong>Sparkling Power Lv. 3</strong>{' '}
                <span className="subtle">+3 rolls, 30 min, wild only</span>
              </label>

              {state.sparkling3 && (
                <>
                  <span className="subtle" style={{ marginTop: 8 }}>
                    Sandwich target type
                  </span>
                  <select
                    value={state.sandwichType ?? ''}
                    onChange={(e) =>
                      setState({
                        ...state,
                        sandwichType: (e.target.value || undefined) as PokeType | undefined,
                      })
                    }
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

              <span className="subtle" style={{ marginTop: 8 }}>
                Mass Outbreak cleared count
              </span>
              <div className="row">
                {OUTBREAK_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    className="toggle"
                    aria-pressed={state.outbreak === o.id}
                    onClick={() => setState({ ...state, outbreak: o.id })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {state.mode === 'breeding' && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={state.masuda}
                onChange={(e) => setState({ ...state, masuda: e.target.checked })}
              />
              <strong>Masuda Method</strong>{' '}
              <span className="subtle">parents from foreign-language games</span>
            </label>
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
                Roughly {odds.per1000.toFixed(2)} shinies per 1000 spawns / eggs.
              </p>
            )}
          </div>

          {recipe && state.sparkling3 && (
            <div className="callout">
              <strong>Sparkling Lv. 3 recipe ({recipe.type}):</strong> {recipe.primary} +{' '}
              {recipe.flavor}. Lasts {recipe.durationMin} minutes. <em>Source: {recipe.source}.</em>
            </div>
          )}

          <div className="callout info">{SV_NOTES.bestStack}</div>
          <div className="callout info">{SV_NOTES.letsGo}</div>

          {caveats.map((c, i) => (
            <div key={i} className="callout">
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />
      <p className="subtle">
        Sources:{' '}
        {SV_SOURCES.map((s, i) => (
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
