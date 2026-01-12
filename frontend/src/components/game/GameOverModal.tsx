/**
 * GameOverModal Component
 * 
 * Displayed when game ends. Shows final score with animated counting.
 */

import React, { useState } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { RetroCounter } from '../ui/RetroCounter';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  round: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
  onHighScoreCelebration?: () => void;
}

export function GameOverModal({
  isOpen,
  score,
  round,
  isNewHighScore,
  onPlayAgain,
  onExit,
  onHighScoreCelebration,
}: GameOverModalProps) {
  const [countingDone, setCountingDone] = useState(false);
  const { shouldRender, isEntering, isExiting } = useAnimation(isOpen, {
    enterDuration: 400,
    exitDuration: 300,
  });

  if (!shouldRender) return null;

  const handleCountComplete = () => {
    setCountingDone(true);
    if (isNewHighScore && onHighScoreCelebration) {
      // Small delay before transitioning to high score celebration
      setTimeout(onHighScoreCelebration, 500);
    }
  };

  const backdropClass = isEntering 
    ? 'animate-in fade-in duration-300' 
    : isExiting 
    ? 'animate-out fade-out duration-200'
    : '';

  const modalClass = isEntering 
    ? 'animate-in fade-in slide-in-from-bottom-4 duration-400' 
    : isExiting 
    ? 'animate-out fade-out slide-out-to-bottom-4 duration-300'
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md ${backdropClass}`}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-sm
          bg-gradient-to-b from-red-900/40 to-black/60
          backdrop-blur-xl rounded-3xl
          border border-red-500/30
          shadow-2xl
          p-8
          ${modalClass}
        `}
      >
        {/* Game Over Title */}
        <div className="text-center mb-8">
          <h2 
            className="text-4xl font-bold text-red-400 mb-2"
            style={{ textShadow: '0 0 20px rgba(248, 113, 113, 0.5)' }}
          >
            GAME OVER
          </h2>
          <p className="text-white/60">
            You reached round {round}
          </p>
        </div>

        {/* Score Display */}
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-widest text-white/50 mb-2">
            Final Score
          </p>
          <RetroCounter 
            value={score}
            duration={2000}
            onComplete={handleCountComplete}
            size="xl"
            showFlash={true}
          />
        </div>

        {/* New High Score Indicator */}
        {isNewHighScore && countingDone && (
          <div 
            className="
              text-center mb-6 py-3 px-4
              bg-yellow-500/20 rounded-xl
              border border-yellow-500/40
              animate-pulse
            "
          >
            <span className="text-yellow-400 font-bold">
              🏆 NEW HIGH SCORE!
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="
              w-full py-4 px-6
              bg-gradient-to-r from-green-500 to-emerald-600
              hover:from-green-400 hover:to-emerald-500
              rounded-2xl font-bold text-lg text-white
              transition-all duration-200
              active:scale-95
              shadow-lg shadow-green-500/30
            "
          >
            Play Again
          </button>
          
          <button
            onClick={onExit}
            className="
              w-full py-3 px-6
              bg-white/10 hover:bg-white/20
              rounded-xl font-medium text-white/80
              transition-all duration-200
              active:scale-95
            "
          >
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;
