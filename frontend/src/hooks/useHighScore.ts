/**
 * useHighScore Hook
 * 
 * Persists and retrieves high score from localStorage.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'simon_solo_highscore';

export function useHighScore() {
  const [highScore, setHighScore] = useState<number>(0);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setHighScore(parsed);
      }
    }
  }, []);

  // Update high score if new score is higher
  const updateHighScore = useCallback((newScore: number) => {
    setHighScore((prev) => {
      if (newScore > prev) {
        localStorage.setItem(STORAGE_KEY, String(newScore));
        return newScore;
      }
      return prev;
    });
  }, []);

  return { highScore, updateHighScore };
}
