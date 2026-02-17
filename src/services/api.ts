import type { Game, GameStatus, UpcomingGame } from '@/types/game';

const ESPN_NBA_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_INTERVAL_MS = 60_000;

function formatStartTime(dateStr?: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getMockLiveGameSnapshot(
  _favoriteTeam?: string,
): SportsServiceResult {
  const minutes = 8;
  const seconds = 42;
  const games: Game[] = [
    {
      id: 'mock-nba-1',
      homeTeam: {
        id: 'mock-lal',
        name: 'Los Angeles Lakers',
        abbreviation: 'LAL',
        score: 102,
      },
      awayTeam: {
        id: 'mock-gsw',
        name: 'Golden State Warriors',
        abbreviation: 'GSW',
        score: 99,
      },
      quarter: 'Q3',
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      rawTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      status: 'in',
      possession: 'LAL',
      lastPlay: 'L.James driving layup. 102-99 LAL.',
      isLive: true,
      clockRunning: true,
      startTime: '7:30 PM',
      headline: 'GSW vs LAL',
      scoreSummary: '99 - 102',
    },
    {
      id: 'mock-nba-2',
      homeTeam: {
        id: 'mock-bos',
        name: 'Boston Celtics',
        abbreviation: 'BOS',
        score: 98,
      },
      awayTeam: {
        id: 'mock-mia',
        name: 'Miami Heat',
        abbreviation: 'MIA',
        score: 95,
      },
      quarter: 'Q4',
      time: '2:15',
      rawTime: '2:15',
      status: 'in',
      possession: 'BOS',
      lastPlay: 'J.Tatum 3pt shot. 98-95 BOS.',
      isLive: true,
      clockRunning: true,
      startTime: '8:00 PM',
      headline: 'MIA vs BOS',
      scoreSummary: '95 - 98',
    },
  ];

  return {
    games,
    hasLiveGame: true,
    nextFavoriteGame: null,
    fromCache: false,
    error: null,
    pollIntervalMs: 15_000,
  };
}

export interface SportsServiceResult {
  games: Game[];
  hasLiveGame: boolean;
  nextFavoriteGame: UpcomingGame | null;
  fromCache: boolean;
  error: string | null;
  pollIntervalMs: number;
}

interface InternalSnapshot {
  games: Game[];
  hasLiveGame: boolean;
  nextFavoriteGame: UpcomingGame | null;
}

export class SportsService {
  private baseIntervalMs: number;
  private consecutiveFailures = 0;
  private lastGoodSnapshot: InternalSnapshot | null = null;

  constructor(baseIntervalMs: number) {
    this.baseIntervalMs = baseIntervalMs;
  }

  public setBaseInterval(intervalMs: number): void {
    this.baseIntervalMs = intervalMs;
  }

  private getCurrentInterval(): number {
    return this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD
      ? CIRCUIT_BREAKER_INTERVAL_MS
      : this.baseIntervalMs;
  }

  public getLiveGames(): Game[] {
    return this.lastGoodSnapshot?.games ?? [];
  }

  public async fetchSnapshot(
    favoriteTeam?: string,
    demoMode = false,
  ): Promise<SportsServiceResult> {
    if (demoMode) {
      return getMockLiveGameSnapshot(favoriteTeam);
    }

    try {
      const response = await fetch(ESPN_NBA_SCOREBOARD_URL);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const snapshot = transformESPNData(data, favoriteTeam);

      this.consecutiveFailures = 0;
      this.lastGoodSnapshot = snapshot;

      return {
        ...snapshot,
        fromCache: false,
        error: null,
        pollIntervalMs: this.getCurrentInterval(),
      };
    } catch (error) {
      this.consecutiveFailures += 1;
      const snapshot =
        this.lastGoodSnapshot ?? {
          games: [],
          hasLiveGame: false,
          nextFavoriteGame: null,
        };

      return {
        ...snapshot,
        fromCache: this.lastGoodSnapshot !== null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch sports data',
        pollIntervalMs: this.getCurrentInterval(),
      };
    }
  }
}

function parseGameStatus(state?: string): GameStatus {
  if (state === 'pre' || state === 'in' || state === 'post') {
    return state;
  }
  return 'unknown';
}

function transformESPNData(apiData: any, favoriteTeam?: string): InternalSnapshot {
  const events: any[] = apiData?.events ?? [];

  const games: Game[] = events
    .map((event) => mapEventToGame(event))
    .filter((g): g is Game => g !== null);

  const hasLiveGame = games.some((g) => g.isLive);
  const nextFavoriteGame = favoriteTeam
    ? findNextFavoriteGame(events, favoriteTeam)
    : null;

  return {
    games,
    hasLiveGame,
    nextFavoriteGame,
  };
}

function mapEventToGame(event: any): Game | null {
  const competitions = event?.competitions ?? [];
  const competition = competitions[0];
  if (!competition) return null;

  const competitors = competition.competitors ?? [];
  const homeTeam = competitors.find(
    (c: any) => c.homeAway === 'home',
  );
  const awayTeam = competitors.find(
    (c: any) => c.homeAway === 'away',
  );
  if (!homeTeam || !awayTeam) return null;

  const status = event.status ?? competition.status ?? {};
  const statusType = status.type ?? {};

  const situation = competition.situation;
  const possession =
    situation?.lastPlay?.team?.abbreviation ??
    situation?.possession?.abbreviation ??
    (parseInt(homeTeam.score ?? '0', 10) >
    parseInt(awayTeam.score ?? '0', 10)
      ? homeTeam.team?.abbreviation
      : awayTeam.team?.abbreviation) ??
    '';

  const lastPlay =
    situation?.lastPlay?.text ??
    situation?.downDistanceText ??
    'Game in progress';

  const period: number = status.period ?? 1;
  const quarter = `Q${period}`;

  const time: string = status.displayClock ?? '15:00';

  const isLive = statusType.state === 'in';
  const clockRunning =
    statusType.completed === false && statusType.state === 'in';

  const homeAbbrev = homeTeam.team?.abbreviation ?? 'HOME';
  const awayAbbrev = awayTeam.team?.abbreviation ?? 'AWAY';
  const homeScore = parseInt(homeTeam.score ?? '0', 10) || 0;
  const awayScore = parseInt(awayTeam.score ?? '0', 10) || 0;

  const dateStr = event?.date ?? competition?.date;
  const startTime = formatStartTime(dateStr);
  const headline = `${awayAbbrev} vs ${homeAbbrev}`;
  const scoreSummary = `${awayScore} - ${homeScore}`;

  const homeLogo =
    homeTeam.team?.logos?.[0]?.href ?? homeTeam.team?.links?.[0]?.href;
  const awayLogo =
    awayTeam.team?.logos?.[0]?.href ?? awayTeam.team?.links?.[0]?.href;

  return {
    id: String(event.id ?? competition.id ?? ''),
    homeTeam: {
      id: String(homeTeam.team?.id ?? ''),
      name: homeTeam.team?.displayName ?? '',
      abbreviation: homeAbbrev,
      score: homeScore,
      logoUrl: homeLogo ?? null,
    },
    awayTeam: {
      id: String(awayTeam.team?.id ?? ''),
      name: awayTeam.team?.displayName ?? '',
      abbreviation: awayAbbrev,
      score: awayScore,
      logoUrl: awayLogo ?? null,
    },
    quarter,
    time,
    rawTime: status.displayClock,
    status: parseGameStatus(statusType.state),
    possession,
    lastPlay,
    isLive,
    clockRunning,
    startTime,
    headline,
    scoreSummary,
  };
}

function findNextFavoriteGame(
  events: any[],
  favoriteTeam: string,
): UpcomingGame | null {
  const now = Date.now();

  const normalizedFavorite = favoriteTeam.toLowerCase();

  const upcomingForFavorite = events
    .filter((event) => {
      const state = event?.status?.type?.state;
      if (state !== 'pre') return false;

      const competitions = event.competitions ?? [];
      const competition = competitions[0];
      if (!competition) return false;

      const competitors = competition.competitors ?? [];

      return competitors.some((c: any) => {
        const team = c.team;
        const name = String(team?.displayName ?? '').toLowerCase();
        const abbrev = String(team?.abbreviation ?? '').toLowerCase();
        return (
          name.includes(normalizedFavorite) ||
          abbrev.includes(normalizedFavorite)
        );
      });
    })
    .map((event) => {
      const competitions = event.competitions ?? [];
      const competition = competitions[0];
      const competitors = competition?.competitors ?? [];

      const home = competitors.find(
        (c: any) => c.homeAway === 'home',
      );
      const away = competitors.find(
        (c: any) => c.homeAway === 'away',
      );
      if (!home || !away) return null;

      const homeName = String(home.team?.displayName ?? '');
      const awayName = String(away.team?.displayName ?? '');

      const favoriteIsHome = homeName
        .toLowerCase()
        .includes(normalizedFavorite);
      const favoriteIsAway = awayName
        .toLowerCase()
        .includes(normalizedFavorite);

      const favoriteSide = favoriteIsHome ? home : awayIsFavorite(away, normalizedFavorite) ? away : null;
      const opponentSide = favoriteSide === home ? away : home;

      if (!favoriteSide || !opponentSide) return null;

      const dateStr: string =
        event.date ?? competition.date ?? new Date().toISOString();
      const start = Date.parse(dateStr);
      if (Number.isNaN(start) || start < now) return null;

      const startDate = new Date(start);

      const opponent = {
        id: String(opponentSide.team?.id ?? ''),
        name: opponentSide.team?.displayName ?? '',
        abbreviation: opponentSide.team?.abbreviation ?? '',
        score: parseInt(opponentSide.score ?? '0', 10) || 0,
      };

      const upcoming: UpcomingGame = {
        id: String(event.id ?? competition.id ?? ''),
        opponent,
        isHome: favoriteSide === home,
        startTimeUtc: startDate.toISOString(),
        startTimeLocal: startDate.toLocaleString(undefined, {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        }),
      };

      return upcoming;
    })
    .filter((g): g is UpcomingGame => g !== null)
    .sort((a, b) => {
      return (
        Date.parse(a.startTimeUtc) - Date.parse(b.startTimeUtc)
      );
    });

  return upcomingForFavorite[0] ?? null;
}

function awayIsFavorite(away: any, normalizedFavorite: string): boolean {
  const awayName = String(away.team?.displayName ?? '').toLowerCase();
  const awayAbbrev = String(away.team?.abbreviation ?? '').toLowerCase();
  return (
    awayName.includes(normalizedFavorite) ||
    awayAbbrev.includes(normalizedFavorite)
  );
}

