import { useEffect, useState } from 'react';
import { games } from '../data/games';
import { load, save } from '../lib/storage';
import type { GameId, Species } from '../lib/types';
import { GameToggles } from './GameToggles';
import { MethodResults } from './MethodResults';
import { TargetSelector } from './TargetSelector';

const KEY_GAMES = 'games:v1';
const KEY_CHARMS = 'charms:v1';

const ALL_GAME_IDS = games.map((g) => g.id);

export function CalculatorPanel() {
  const [target, setTarget] = useState<Species | null>(null);

  const [ownedArr, setOwnedArr] = useState<GameId[]>(() =>
    load<GameId[]>(KEY_GAMES, ['za', 'sv']),
  );
  const [charms, setCharms] = useState<Record<GameId, boolean>>(() =>
    load<Record<GameId, boolean>>(KEY_CHARMS, {} as Record<GameId, boolean>),
  );

  useEffect(() => {
    save(KEY_GAMES, ownedArr);
  }, [ownedArr]);

  useEffect(() => {
    save(KEY_CHARMS, charms);
  }, [charms]);

  const owned = new Set(ownedArr);

  const toggleGame = (id: GameId) => {
    setOwnedArr((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id].filter((g) => ALL_GAME_IDS.includes(g)),
    );
  };
  const toggleCharm = (id: GameId) => {
    setCharms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <TargetSelector value={target} onChange={setTarget} />
      <GameToggles
        ownedGames={owned}
        onToggleGame={toggleGame}
        charms={charms}
        onToggleCharm={toggleCharm}
      />
      <MethodResults target={target} ownedGames={owned} charms={charms} />
    </div>
  );
}
