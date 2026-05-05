import { methods } from '../data/methods';
import { gameById } from '../data/games';
import { rollsToOdds, compareOdds } from '../lib/odds';
import type { GameId, Method, Species } from '../lib/types';
import { ChipRow } from './Chip';
import { Sprite } from './Sprite';

interface MethodResultsProps {
  target: Species | null;
  ownedGames: Set<GameId>;
  charms: Record<GameId, boolean>;
}

interface RankedMethod {
  method: Method;
  oddsLabel: string;
  rolls: number;
  available: boolean;
  reason?: string;
}

function methodRequiresCharm(m: Method): boolean {
  return m.modifiers.includes('shinyCharm');
}

export function MethodResults({ target, ownedGames, charms }: MethodResultsProps) {
  if (!target) {
    return (
      <div className="card">
        <h2>3. Best methods</h2>
        <p className="muted">Pick a target species to see ranked methods across your owned games.</p>
      </div>
    );
  }

  const availableGames = Object.entries(target.availabilityByGame).filter(([gid]) =>
    ownedGames.has(gid as GameId),
  ) as Array<[GameId, NonNullable<typeof target.availabilityByGame[GameId]>]>;

  if (availableGames.length === 0) {
    return (
      <div className="card">
        <h2>3. Best methods</h2>
        <p className="muted">
          {target.name} is not available in any of the games you own (or you haven&apos;t selected
          any).
        </p>
        <div className="callout warn">
          {Object.keys(target.availabilityByGame).length === 0
            ? 'No games in dataset for this species (prototype coverage limited).'
            : `Available in: ${Object.keys(target.availabilityByGame).join(', ')}.`}
        </div>
      </div>
    );
  }

  const lockedAnywhere = availableGames.some(([, a]) => a.locked);

  const ranked: RankedMethod[] = [];
  for (const [gid, avail] of availableGames) {
    if (avail.locked) {
      continue;
    }
    const candidates = methods.filter((m) => m.gameId === gid);
    for (const m of candidates) {
      const requiresCharm = methodRequiresCharm(m);
      const available = !requiresCharm || !!charms[gid];
      const odds = rollsToOdds(m.rolls);
      ranked.push({
        method: m,
        oddsLabel: odds.oddsLabel,
        rolls: m.rolls,
        available,
        reason: !available ? 'Requires Shiny Charm (toggle on if you have it).' : undefined,
      });
    }
  }

  ranked.sort((a, b) =>
    compareOdds(rollsToOdds(a.rolls), rollsToOdds(b.rolls)),
  );

  return (
    <div className="card">
      <div className="sprite-row" style={{ marginBottom: 4 }}>
        <Sprite species={target} size={56} variant="artwork" />
        <div>
          <h2 style={{ marginBottom: 0 }}>3. Best methods for {target.name}</h2>
          <span className="subtle">
            #{String(target.dexNumber).padStart(4, '0')} - {target.types.join(' / ')}
          </span>
        </div>
      </div>
      <p className="muted">Ranked by best base odds. Methods needing gear you don&apos;t have are dimmed.</p>

      {lockedAnywhere && (
        <div className="callout warn" style={{ marginBottom: 12 }}>
          🚫 {target.name} is shiny-locked in:{' '}
          {availableGames
            .filter(([, a]) => a.locked)
            .map(([gid, a]) => `${gameById[gid].shortName}${a.notes ? ` (${a.notes})` : ''}`)
            .join('; ')}
        </div>
      )}

      <ul className="clean">
        {ranked.map(({ method, oddsLabel, available, reason }) => (
          <li key={method.id} style={{ opacity: available ? 1 : 0.55 }}>
            <div className="method-row">
              <div className="meta">
                <span className="name">
                  {gameById[method.gameId].shortName} - {method.name}
                </span>
                <ChipRow ids={method.categories} />
                {method.notes && <span className="subtle">{method.notes}</span>}
                {!available && reason && <span className="subtle">{reason}</span>}
              </div>
              <span className="odds">{oddsLabel}</span>
            </div>
          </li>
        ))}
        {ranked.length === 0 && (
          <li className="subtle">No non-locked methods in your owned games.</li>
        )}
      </ul>
    </div>
  );
}
