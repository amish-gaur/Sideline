export type GameStatus = 'pre' | 'in' | 'post' | 'unknown';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  score: number;
  logoUrl?: string | null;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  quarter: string;
  time: string;
  rawTime?: string | null;
  status: GameStatus;
  possession: string;
  lastPlay: string;
  isLive: boolean;
  clockRunning: boolean;
  startTime: string;
  startDateUtc?: string | null;
  headline: string;
  scoreSummary: string;
}

export interface UpcomingGame {
  id: string;
  opponent: Team;
  isHome: boolean;
  startTimeUtc: string;
  startTimeLocal: string;
}

export interface SportsSnapshot {
  liveGame: Game | null;
  hasLiveGame: boolean;
  nextFavoriteGame: UpcomingGame | null;
}

