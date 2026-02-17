import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Game, UpcomingGame } from '@/types/game';
import { useGameClock } from '@/hooks/useGameClock';
import GameSelector from './GameSelector';

const COLLAPSED_WIDTH = 220;
const COLLAPSED_HEIGHT = 44;
const EXPANDED_WIDTH = 400;
const EXPANDED_HEIGHT = 200;
const EMPTY_STATE_WIDTH = 260;
const EMPTY_STATE_HEIGHT = 72;

const scoreVariants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: -20,
    opacity: 0,
  },
};

interface GameStateForUI {
  games: Game[];
  hasLiveGame: boolean;
  nextFavoriteGame: UpcomingGame | null;
  isLoading: boolean;
  error: string | null;
}

interface DynamicIslandProps {
  gameState: GameStateForUI;
  activeGameId: string | null;
  onSelectGame: (game: Game) => void;
  settingsLoaded: boolean;
  demoMode?: boolean;
  onStartSimulation?: () => void;
  onStopSimulation?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const expandedSlide = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="11" fill="#EE6730" stroke="#1a1a1a" strokeWidth="1.5" />
      <path
        d="M12 2a15.3 15.3 0 0 1 4 4 15.3 15.3 0 0 1-4 4 15.3 15.3 0 0 1-4-4 15.3 15.3 0 0 1 4-4z"
        stroke="#1a1a1a"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M12 22a15.3 15.3 0 0 0 4-4 15.3 15.3 0 0 0-4-4 15.3 15.3 0 0 0-4 4 15.3 15.3 0 0 0 4 4z"
        stroke="#1a1a1a"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M2 12c0-2 .8-4 2-5.5S6.5 4 8 4M22 12c0 2-.8 4-2 5.5S17.5 20 16 20"
        stroke="#1a1a1a"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  gameState,
  activeGameId,
  onSelectGame,
  settingsLoaded,
  demoMode = false,
  onStartSimulation,
  onStopSimulation,
  onHoverStart,
  onHoverEnd,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [borderFlash, setBorderFlash] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [basketballFly, setBasketballFly] = useState<'home' | 'away' | null>(null);
  const previousScoreRef = useRef<{ home: number | null; away: number | null }>(
    { home: null, away: null },
  );

  const activeGame =
    gameState.games.find((g) => g.id === activeGameId) ??
    gameState.games[0] ??
    null;
  const gameWithClock = useGameClock(activeGame);
  const game = gameWithClock ?? activeGame;

  useEffect(() => {
    if (!game) return;

    const currentHome = game.homeTeam.score;
    const currentAway = game.awayTeam.score;

    const prevHome = previousScoreRef.current.home;
    const prevAway = previousScoreRef.current.away;

    if (prevHome === null || prevAway === null) {
      previousScoreRef.current = {
        home: currentHome,
        away: currentAway,
      };
      return;
    }

    const scoreChanged =
      prevHome !== currentHome || prevAway !== currentAway;

    if (scoreChanged) {
      setBorderFlash(true);
      const homeScored = currentHome > prevHome;
      setBasketballFly(homeScored ? 'home' : 'away');

      const timeout = setTimeout(() => setBorderFlash(false), 3000);
      const ballTimeout = setTimeout(() => setBasketballFly(null), 900);

      previousScoreRef.current = {
        home: currentHome,
        away: currentAway,
      };

      return () => {
        clearTimeout(timeout);
        clearTimeout(ballTimeout);
      };
    }
  }, [game?.homeTeam.score, game?.awayTeam.score, game]);

  const showEmptyState =
    settingsLoaded &&
    !gameState.isLoading &&
    !gameState.hasLiveGame;

  const handleMouseEnter = () => {
    setIsExpanded(true);
    onHoverStart?.();
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    onHoverEnd?.();
  };

  const handleClose = () => {
    if (window.electronAPI?.closeApp) {
      window.electronAPI.closeApp();
    } else {
      window.close();
    }
  };

  const getBorderColor = () => {
    if (!game || !borderFlash) return 'rgba(255, 255, 255, 0.1)';

    const homeScore = game.homeTeam.score;
    const awayScore = game.awayTeam.score;
    const prevHome = previousScoreRef.current.home ?? homeScore;
    const prevAway = previousScoreRef.current.away ?? awayScore;

    if (homeScore > prevHome) {
      return 'rgba(34, 197, 94, 0.8)';
    }
    if (awayScore > prevAway) {
      return 'rgba(239, 68, 68, 0.8)';
    }
    return 'rgba(255, 255, 255, 0.6)';
  };

  const renderSkeleton = () => (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className="
          px-4 py-2
          rounded-full
          bg-gray-700/80
          border border-white/10
          animate-pulse
          w-[180px]
        "
      >
        <div className="h-3 rounded-full bg-gray-500/80" />
      </div>
    </div>
  );

  const renderEmptyState = () => {
    return (
      <motion.div
        className="flex items-center justify-center w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="flex items-center justify-center h-full gap-3 px-5 rounded-full bg-black border border-white/[0.15] shadow-lg font-sans"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
        >
          <span className="text-sm font-medium text-white/80">
            No games on right now, or pick a game.
          </span>
          {onStartSimulation && (
            <button
              type="button"
              onClick={onStartSimulation}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white no-underline hover:bg-white/20 transition-colors pointer-events-auto"
            >
              Simulate
            </button>
          )}
        </motion.div>
      </motion.div>
    );
  };

  if (!settingsLoaded || gameState.isLoading) {
    return renderSkeleton();
  }

  const hasGames = gameState.games.length > 0;
  if (!hasGames && !gameState.hasLiveGame) {
    return renderEmptyState();
  }

  if (!game && !showSelector) {
    return renderSkeleton();
  }

  return (
    <div className="flex items-center justify-center w-full h-full pointer-events-none">
      <motion.div
        layout
        className="relative overflow-hidden border pointer-events-auto border-red-500"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: isExpanded ? 32 : 22,
          backgroundColor: isExpanded
            ? 'rgba(28, 28, 30, 0.92)'
            : '#000000',
          borderColor: borderFlash
            ? getBorderColor()
            : isExpanded
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(255, 255, 255, 0.1)',
          borderWidth: borderFlash ? 2 : 1,
          boxShadow: borderFlash
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.24)'
            : isExpanded
              ? '0 0 0 1px rgba(0,0,0,0.2), 0 4px 24px rgba(0,0,0,0.18)'
              : '0 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          borderRadius: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
          borderColor: {
            duration: 0.2,
          },
          borderWidth: {
            duration: 0.2,
          },
        }}
      >
        <AnimatePresence>
          {basketballFly && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
              initial={false}
            >
              <motion.div
                className="absolute w-6 h-6"
                style={{ left: '50%', top: '50%', marginLeft: -12, marginTop: -12 }}
                initial={{
                  x: basketballFly === 'home' ? -(isExpanded ? 180 : 90) : (isExpanded ? 180 : 90),
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: basketballFly === 'home' ? (isExpanded ? 180 : 90) : -(isExpanded ? 180 : 90),
                  y: [0, -14, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <BasketballIcon className="w-full h-full drop-shadow-md" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <CollapsedView
              key="collapsed"
              game={game}
              onStartSimulation={onStartSimulation}
            />
          ) : showSelector ? (
            <GameSelector
              key="selector"
              games={gameState.games}
              activeGameId={activeGameId}
              onSelectGame={(g) => {
                onSelectGame(g);
                setShowSelector(false);
              }}
              onBack={() => setShowSelector(false)}
              onStartSimulation={onStartSimulation}
            />
          ) : (
            <ExpandedView
              key="expanded"
              game={game!}
              onClose={handleClose}
              demoMode={demoMode}
              onStopSimulation={onStopSimulation}
              onOpenGames={() => setShowSelector(true)}
              gamesCount={gameState.games.length}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface CollapsedViewProps {
  game: Game;
  onStartSimulation?: () => void;
}

function isGameActuallyLive(game: Game): boolean {
  if (game.status !== 'in') return false;
  if (
    game.quarter === 'Q0' &&
    game.homeTeam.score === 0 &&
    game.awayTeam.score === 0
  ) {
    return false;
  }
  return true;
}

const CollapsedView: React.FC<CollapsedViewProps> = ({
  game,
  onStartSimulation,
}) => {
  const actuallyLive = isGameActuallyLive(game);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-between h-full px-4 gap-4 bg-transparent"
    >
      <div className="flex items-center gap-2 shrink-0">
        {actuallyLive ? (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-red-400">
              LIVE
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white/90 text-xs font-medium">
              No games on right now
            </span>
            {onStartSimulation && (
              <button
                type="button"
                onClick={onStartSimulation}
                className="text-green-400 hover:text-green-300 text-[10px] font-medium underline underline-offset-0.5 shrink-0 pointer-events-auto"
              >
                Simulate
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-white text-sm font-bold min-w-0 shrink-0 font-mono">
        <span className="text-white font-bold tabular-nums">
          {game.homeTeam.abbreviation}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={game.homeTeam.score}
            variants={scoreVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="text-white/90 tabular-nums"
          >
            {game.homeTeam.score}
          </motion.span>
        </AnimatePresence>
        <span className="text-white/30">-</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={game.awayTeam.score}
            variants={scoreVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="text-white/90 tabular-nums"
          >
            {game.awayTeam.score}
          </motion.span>
        </AnimatePresence>
        <span className="text-white font-bold tabular-nums">
          {game.awayTeam.abbreviation}
        </span>
      </div>
    </motion.div>
  );
};

interface ExpandedViewProps {
  game: Game;
  onClose: () => void;
  demoMode?: boolean;
  onStopSimulation?: () => void;
  onOpenGames?: () => void;
  gamesCount?: number;
}

const ExpandedView: React.FC<ExpandedViewProps> = ({
  game,
  onClose,
  demoMode = false,
  onStopSimulation,
  onOpenGames,
  gamesCount = 0,
}) => {
  const notStarted =
    game.status === 'pre' ||
    (game.quarter === 'Q0' &&
      game.homeTeam.score === 0 &&
      game.awayTeam.score === 0);

  return (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-4 h-full flex flex-col bg-transparent"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {notStarted ? (
          <span className="text-white/80 text-xs font-semibold">Upcoming</span>
        ) : (
          <>
            <motion.div
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className="text-white text-xs font-semibold">LIVE</span>
          </>
        )}
        {demoMode && (
          <span className="text-amber-400/90 text-[10px] font-medium uppercase tracking-wide">
            Simulated
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {gamesCount > 1 && onOpenGames && (
          <button
            type="button"
            onClick={onOpenGames}
            className="text-white/80 hover:text-white text-xs font-medium px-2 py-1 rounded bg-white/10 pointer-events-auto"
            aria-label="Switch game"
          >
            Games
          </button>
        )}
        {demoMode && onStopSimulation && (
          <button
            type="button"
            onClick={onStopSimulation}
            className="text-amber-400/90 hover:text-amber-300 text-xs px-2 py-0.5 rounded pointer-events-auto"
          >
            Exit simulation
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1 pointer-events-auto"
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div className="flex-1 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-white font-bold text-lg">
            {game.homeTeam.name}
          </div>
          <div className="text-white font-bold text-lg">
            {game.awayTeam.name}
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <ScoreBlock score={game.homeTeam.score} />
          <div className="text-gray-400">-</div>
          <ScoreBlock score={game.awayTeam.score} />
        </div>
      </div>

      {notStarted ? (
        <div className="pt-2 border-t border-white/10">
          <p className="text-white/90 text-sm leading-relaxed">
            Will start at {game.startTime}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="font-semibold">{game.quarter}</span>
            <span className="text-white/60">•</span>
            <span className="font-mono">{game.time}</span>
            <span className="text-white/60">•</span>
            <span>Possession: {game.possession}</span>
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-white/90 text-sm leading-relaxed">
              {game.lastPlay}
            </p>
          </div>
        </>
      )}
    </div>
  </motion.div>
  );
};

interface ScoreBlockProps {
  score: number;
}

const ScoreBlock: React.FC<ScoreBlockProps> = ({ score }) => (
  <div className="text-center">
    <div
      className="text-2xl font-bold relative overflow-hidden"
      style={{ minWidth: 40, minHeight: 32 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={score}
          variants={scoreVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {score}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
);

export default DynamicIsland;

