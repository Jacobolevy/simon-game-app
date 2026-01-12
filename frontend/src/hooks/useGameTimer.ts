/**
 * useGameTimer Hook
 * 
 * Manages countdown timer for player turns.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseGameTimerOptions {
  /** Time limit in seconds */
  timeLimit: number;
  /** Called when timer reaches zero */
  onTimeUp: () => void;
  /** Whether the timer should be running */
  isActive: boolean;
}

export function useGameTimer({ timeLimit, onTimeUp, isActive }: UseGameTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep onTimeUp ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  // Timer logic
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Use setTimeout to avoid state update during render
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  return {
    timeRemaining,
    resetTimer,
    totalTime: timeLimit,
  };
}
