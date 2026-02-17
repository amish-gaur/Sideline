import { useEffect, useRef, useState } from 'react';
import { SportsService } from '@/services/api';
import type { Game, UpcomingGame } from '@/types/game';

const DRIFT_THRESHOLD_SECONDS = 5;

export interface LiveGameState {
  games: Game[];
  hasLiveGame: boolean;
  nextFavoriteGame: UpcomingGame | null;
  isLoading: boolean;
  error: string | null;
}

interface UseLiveGameOptions {
  favoriteTeam: string;
  refreshRateMs: number;
  demoMode?: boolean;
}

export function useLiveGame(options: UseLiveGameOptions): LiveGameState {
  const { favoriteTeam, refreshRateMs, demoMode = false } = options;

  const [state, setState] = useState<LiveGameState>({
    games: [],
    hasLiveGame: false,
    nextFavoriteGame: null,
    isLoading: true,
    error: null,
  });

  const serviceRef = useRef<SportsService | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new SportsService(refreshRateMs);
    } else {
      serviceRef.current.setBaseInterval(refreshRateMs);
    }
  }, [refreshRateMs]);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = (delayMs: number) => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = setTimeout(fetchOnce, delayMs);
    };

    const fetchOnce = async () => {
      if (!serviceRef.current) return;

      const result = await serviceRef.current.fetchSnapshot(
        favoriteTeam,
        demoMode,
      );
      if (cancelled) return;

      setState({
        games: result.games,
        hasLiveGame: result.hasLiveGame,
        nextFavoriteGame: result.nextFavoriteGame,
        isLoading: false,
        error: result.error,
      });

      scheduleNext(result.pollIntervalMs);
    };

    setState((prev) => ({ ...prev, isLoading: true }));
    fetchOnce();

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [favoriteTeam, refreshRateMs, demoMode]);

  useEffect(() => {
    if (!demoMode || state.games.length === 0) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const games = [...prev.games];
        const g = games[0];
        if (!g) return prev;

        const homeScore = g.homeTeam.score;
        const awayScore = g.awayTeam.score;
        const homeScored = Math.random() > 0.5;

        const newHomeScore = homeScored ? homeScore + (Math.random() > 0.7 ? 3 : 2) : homeScore;
        const newAwayScore = !homeScored ? awayScore + (Math.random() > 0.7 ? 3 : 2) : awayScore;

        const plays = homeScored
          ? ['L.James driving layup.', 'A.Davis dunk.', 'D.Russell 3pt shot.', 'J.Vanderbilt putback.']
          : ['S.Curry 3-pointer.', 'A.Wiggins mid-range.', 'D.Green alley-oop.', 'K.Thompson catch and shoot.'];
        const lastPlay = plays[Math.floor(Math.random() * plays.length)];

        games[0] = {
          ...g,
          homeTeam: { ...g.homeTeam, score: newHomeScore },
          awayTeam: { ...g.awayTeam, score: newAwayScore },
          lastPlay: `${lastPlay} ${newAwayScore} - ${newHomeScore} ${g.homeTeam.abbreviation}.`,
          scoreSummary: `${newAwayScore} - ${newHomeScore}`,
        };

        return { ...prev, games };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [demoMode, state.games.length]);

  return state;
}
