import { useEffect, useRef, useState } from 'react';
import type { Game } from '@/types/game';

const TICK_MS = 1000;
const DRIFT_THRESHOLD = 5;

function parseTimeToSeconds(timeString?: string | null): number | null {
  if (!timeString || timeString === '--' || timeString === '') return null;
  const parts = timeString.split(':');
  if (parts.length !== 2) return null;
  const minutes = Number.parseInt(parts[0] ?? '', 10);
  const seconds = Number.parseInt(parts[1] ?? '', 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

function formatSeconds(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useGameClock(game: Game | null): Game | null {
  const [displayTime, setDisplayTime] = useState<string>(game?.time ?? '0:00');
  const secondsRef = useRef<number | null>(
    game ? parseTimeToSeconds(game.rawTime) : null,
  );
  const clockRunningRef = useRef(
    Boolean(game?.isLive && game?.clockRunning),
  );

  useEffect(() => {
    if (!game) {
      setDisplayTime('0:00');
      secondsRef.current = null;
      clockRunningRef.current = false;
      return;
    }

    const rawSeconds = parseTimeToSeconds(game.rawTime);
    const running = game.isLive && game.clockRunning;

    if (
      rawSeconds !== null &&
      (secondsRef.current === null ||
        Math.abs(secondsRef.current - rawSeconds) > DRIFT_THRESHOLD)
    ) {
      secondsRef.current = rawSeconds;
      setDisplayTime(formatSeconds(rawSeconds));
    } else if (rawSeconds !== null) {
      secondsRef.current = rawSeconds;
      setDisplayTime(formatSeconds(rawSeconds));
    } else {
      setDisplayTime(game.time);
    }
    clockRunningRef.current = running;
  }, [game?.id, game?.rawTime, game?.time, game?.isLive, game?.clockRunning]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!clockRunningRef.current || secondsRef.current === null) return;
      const cur = secondsRef.current;
      if (cur > 0) {
        secondsRef.current = cur - 1;
        setDisplayTime(formatSeconds(secondsRef.current));
      } else {
        clockRunningRef.current = false;
        setDisplayTime('0:00');
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  if (!game) return null;
  return { ...game, time: displayTime };
}
