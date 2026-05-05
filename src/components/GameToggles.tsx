import { games } from '../data/games';
import type { GameId } from '../lib/types';

interface GameTogglesProps {
  ownedGames: Set<GameId>;
  onToggleGame: (id: GameId) => void;
  charms: Record<GameId, boolean>;
  onToggleCharm: (id: GameId) => void;
}

export function GameToggles({ ownedGames, onToggleGame, charms, onToggleCharm }: GameTogglesProps) {
  return (
    <div className="card">
      <h2>2. Games you own (and Shiny Charms you have)</h2>
      <p className="muted">
        Methods are filtered to the games you check. Charm rows enable charm-boosted methods.
      </p>
      <ul className="clean">
        {games.map((g) => {
          const owned = ownedGames.has(g.id);
          return (
            <li key={g.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <label className="checkbox">
                  <input type="checkbox" checked={owned} onChange={() => onToggleGame(g.id)} />
                  <strong>{g.name}</strong>
                  <span className="subtle">- {g.shortName}</span>
                </label>
                <label className="checkbox" style={{ opacity: owned ? 1 : 0.4 }}>
                  <input
                    type="checkbox"
                    disabled={!owned}
                    checked={!!charms[g.id]}
                    onChange={() => onToggleCharm(g.id)}
                  />
                  <span>🧲 Shiny Charm</span>
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
