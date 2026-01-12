/**
 * GameOverModal - Compact Mobile App Style
 */

import { useState } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { RetroCounter } from '../ui/RetroCounter';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  round: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function GameOverModal({
  isOpen,
  score,
  round,
  isNewHighScore,
  onPlayAgain,
  onExit,
}: GameOverModalProps) {
  const [countingDone, setCountingDone] = useState(false);
  const { shouldRender, isEntering, isExiting } = useAnimation(isOpen, {
    enterDuration: 400,
    exitDuration: 300,
  });

  if (!shouldRender) return null;

  const handleCountComplete = () => {
    setCountingDone(true);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        /* This modal is fixed and bypasses AppShell padding. Respect safe areas. */
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md ${backdropClass}`}
      />
      
      {/* Modal - Compact */}
      <div 
        className={`
          relative w-full max-w-xs
          bg-gradient-to-b from-red-900/40 to-black/60
          backdrop-blur-xl rounded-2xl
          border border-red-500/30
          shadow-2xl
          p-5
          ${modalClass}
        `}
      >
        {/* Game Over Title */}
        <div className="text-center mb-5">
          <h2 
            className="text-2xl font-bold text-red-400 mb-1"
            style={{ textShadow: '0 0 15px rgba(248, 113, 113, 0.5)' }}
          >
            GAME OVER
          </h2>
          <p className="text-white/60 text-sm">
            You reached round {round}
          </p>
        </div>

        {/* Score Display */}
        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
            Final Score
          </p>
          <RetroCounter 
            value={score}
            duration={2000}
            onComplete={handleCountComplete}
            size="lg"
            showFlash={true}
          />
        </div>

        {/* New High Score Indicator */}
        {isNewHighScore && countingDone && (
          <div 
            className="
              text-center mb-4 py-2 px-3
              bg-yellow-500/20 rounded-lg
              border border-yellow-500/40
              animate-pulse
            "
          >
            <span className="text-yellow-400 font-semibold text-sm">
              🏆 NEW HIGH SCORE!
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onPlayAgain}
            className="
              w-full py-3 px-4
              bg-gradient-to-r from-green-500 to-emerald-600
              hover:from-green-400 hover:to-emerald-500
              rounded-xl font-semibold text-base text-white
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
              w-full py-2.5 px-4
              bg-white/10 hover:bg-white/20
              rounded-lg font-medium text-sm text-white/80
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
