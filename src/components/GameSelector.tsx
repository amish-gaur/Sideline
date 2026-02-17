import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Game } from '@/types/game';

const TEAM_COLORS: Record<string, string> = {
  ATL: '#E03A3E',
  BOS: '#007A33',
  BKN: '#000000',
  CHA: '#1D1160',
  CHI: '#CE1141',
  CLE: '#860038',
  DAL: '#00538C',
  DEN: '#0E2240',
  DET: '#C8102E',
  GSW: '#1D428A',
  HOU: '#CE1141',
  IND: '#002D62',
  LAC: '#C8102E',
  LAL: '#552583',
  MEM: '#5D76A9',
  MIA: '#98002E',
  MIL: '#00471B',
  MIN: '#0C2340',
  NOP: '#0C2340',
  NYK: '#006BB6',
  OKC: '#007AC1',
  ORL: '#0077C0',
  PHI: '#006BB6',
  PHX: '#1D1160',
  POR: '#E03A3E',
  SAC: '#5A2D81',
  SAS: '#C4CED4',
  TOR: '#CE1141',
  UTA: '#002B5C',
  WAS: '#002B5C',
};

const CARD_WIDTH = 76;
const CARD_HEIGHT = 72;

interface GameCardProps {
  game: Game;
  isActive: boolean;
  onSelect: () => void;
}

function TeamLogo({
  abbreviation,
}: {
  abbreviation: string;
  logoUrl?: string | null;
}) {
  const color = TEAM_COLORS[abbreviation] ?? '#374151';
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
      style={{ backgroundColor: color }}
    >
      {abbreviation.slice(0, 2)}
    </div>
  );
}

const GameCard: React.FC<GameCardProps> = ({ game, isActive, onSelect }) => {
  const actuallyLive =
    game.isLive &&
    !(
      game.quarter === 'Q0' &&
      game.homeTeam.score === 0 &&
      game.awayTeam.score === 0
    );

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="relative shrink-0 flex flex-col items-center justify-center rounded-xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 overflow-hidden"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: isActive ? 'rgba(55, 65, 81, 0.95)' : 'rgba(31, 41, 55, 0.9)',
        borderColor: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
        boxShadow: isActive ? '0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.2)',
      }}
      whileTap={{ scale: 0.97 }}
      initial={false}
      animate={{
        scale: isActive ? 1.02 : 1,
      }}
    >
      <div className="flex items-center gap-1 mb-1.5">
        <TeamLogo abbreviation={game.awayTeam.abbreviation} />
        <span className="text-gray-500 text-[9px] font-medium">vs</span>
        <TeamLogo abbreviation={game.homeTeam.abbreviation} />
      </div>
      {actuallyLive ? (
        <span className="text-[11px] font-semibold text-white tabular-nums">
          {game.scoreSummary}
        </span>
      ) : (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[9px] text-white/70">Will start at</span>
          <span className="text-[11px] font-semibold text-white">
            {game.startTime}
          </span>
        </div>
      )}
      {actuallyLive && (
        <motion.div
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

interface GameSelectorProps {
  games: Game[];
  activeGameId: string | null;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
  onStartSimulation?: () => void;
}

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

export const GameSelector: React.FC<GameSelectorProps> = ({
  games,
  activeGameId,
  onSelectGame,
  onBack,
  onStartSimulation,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
    if (e.deltaY !== 0 && (e.deltaY > 0 ? canScrollRight : canScrollLeft)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col bg-[#171717] rounded-2xl overflow-hidden"
      {...slideIn}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 gap-2">
        <span className="text-white text-sm font-semibold tracking-tight">
          Games
        </span>
        <div className="flex items-center gap-2">
          {onStartSimulation && (
            <button
              type="button"
              onClick={onStartSimulation}
              className="text-green-400 hover:text-green-300 text-xs font-medium px-2 py-1 rounded"
            >
              Simulate a game
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        data-game-selector-scroll
        onWheel={handleWheel}
        className="flex-1 min-h-0 min-w-0 p-3 scrollbar-none overflow-y-hidden"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}
      >
        <div
          className="flex gap-3 items-center"
          style={{ width: 'max-content', minHeight: '100%' }}
        >
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isActive={game.id === activeGameId}
              onSelect={() => onSelectGame(game)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GameSelector;
