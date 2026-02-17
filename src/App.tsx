import React, { useEffect, useState } from 'react';
import DynamicIsland from './components/DynamicIsland';
import { useLiveGame } from './hooks/useLiveGame';
import { useSettings } from './context/SettingsContext';
import type { Game } from './types/game';

const DEMO_STORAGE_KEY = 'sideline:demoMode';
const ACTIVE_GAME_KEY = 'sideline:activeGameId';

const App: React.FC = () => {
  const { settings, isLoaded } = useSettings();
  const [demoMode, setDemoMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.localStorage.getItem(DEMO_STORAGE_KEY) === 'true'
      : false,
  );
  const [activeGameId, setActiveGameId] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? window.localStorage.getItem(ACTIVE_GAME_KEY)
      : null,
  );

  const gameState = useLiveGame({
    favoriteTeam: settings.favoriteTeam,
    refreshRateMs: settings.refreshRate,
    demoMode,
  });

  const { games } = gameState;

  useEffect(() => {
    if (games.length === 0) return;
    const currentActive =
      games.find((g) => g.id === activeGameId) ?? null;
    if (currentActive) return;
    const firstLive = games.find((g) => g.isLive);
    const next = firstLive ?? games[0];
    if (next) {
      setActiveGameId(next.id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTIVE_GAME_KEY, next.id);
      }
    }
  }, [games, activeGameId]);

  const handleSelectGame = (game: Game) => {
    setActiveGameId(game.id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_GAME_KEY, game.id);
    }
  };

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }, []);

  const handleHoverStart = () => {
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
  };

  const handleHoverEnd = () => {
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  };

  const handleStartSimulation = () => {
    window.localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    setDemoMode(true);
  };

  const handleStopSimulation = () => {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    setDemoMode(false);
  };

  return (
    <div 
      className="w-full h-full bg-transparent pointer-events-auto"
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <DynamicIsland
        gameState={gameState}
        activeGameId={activeGameId}
        onSelectGame={handleSelectGame}
        settingsLoaded={isLoaded}
        demoMode={demoMode}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
      />
    </div>
  );
};

export default App;

