/**
 * Jelly Simon Board Component - Simon 2026
 * 
 * Glassmorphism styled Simon board with 2x2 grid layout.
 * Features:
 * - Dark semi-transparent glass container
 * - 2x2 grid with generous spacing
 * - Central HUD space
 * - 3D Jelly Glass buttons
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Color } from '../../../shared/types';
import { GlassButton } from './GlassButton';

// =============================================================================
// TYPES
// =============================================================================

export interface JellySimonBoardProps {
  /** Current sequence to display */
  sequence?: Color[];
  /** Whether currently showing the sequence animation */
  isShowingSequence?: boolean;
  /** Whether in input phase (player can click) */
  isInputPhase?: boolean;
  /** Player's current input sequence */
  playerSequence?: Color[];
  /** Called when player clicks a color */
  onColorClick?: (color: Color) => void;
  /** Whether buttons are disabled */
  disabled?: boolean;
  /** Current round number */
  round?: number;
  /** Demo mode - standalone preview without game logic */
  demoMode?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Grid order: top-left, top-right, bottom-left, bottom-right
const GRID_COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];

// =============================================================================
// COMPONENT
// =============================================================================

export const JellySimonBoard: React.FC<JellySimonBoardProps> = ({
  sequence = [],
  isShowingSequence = false,
  isInputPhase = true,
  playerSequence = [],
  onColorClick,
  disabled = false,
  round = 1,
  demoMode = false,
}) => {
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo mode: cycle through colors automatically
  useEffect(() => {
    if (!demoMode) return;

    let colorIndex = 0;
    demoIntervalRef.current = setInterval(() => {
      setActiveColor(GRID_COLORS[colorIndex]);
      
      setTimeout(() => {
        setActiveColor(null);
      }, 400);
      
      colorIndex = (colorIndex + 1) % GRID_COLORS.length;
    }, 1200);

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode]);

  // Sequence animation
  useEffect(() => {
    if (demoMode || !isShowingSequence || sequence.length === 0) {
      if (!demoMode) setActiveColor(null);
      return;
    }

    const SHOW_DURATION = 500;
    const GAP_DURATION = 200;
    let currentIndex = 0;
    let isCancelled = false;

    const showNext = () => {
      if (isCancelled || currentIndex >= sequence.length) {
        setActiveColor(null);
        return;
      }

      const color = sequence[currentIndex];
      setActiveColor(color);

      setTimeout(() => {
        if (isCancelled) return;
        setActiveColor(null);
        currentIndex++;

        if (!isCancelled && currentIndex < sequence.length) {
          setTimeout(showNext, GAP_DURATION);
        }
      }, SHOW_DURATION);
    };

    const startTimeout = setTimeout(showNext, 300);

    return () => {
      isCancelled = true;
      clearTimeout(startTimeout);
      setActiveColor(null);
    };
  }, [isShowingSequence, sequence, demoMode]);

  // Handle color click
  const handleColorClick = useCallback(
    (color: Color) => {
      if (demoMode) {
        setActiveColor(color);
        setTimeout(() => setActiveColor(null), 200);
        return;
      }

      if (disabled || isShowingSequence || !isInputPhase) return;

      setActiveColor(color);
      setTimeout(() => setActiveColor(null), 150);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      onColorClick?.(color);
    },
    [demoMode, disabled, isShowingSequence, isInputPhase, onColorClick]
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ============================================
          GLASS BOARD CONTAINER
          ============================================ */}
      <div 
        className="
          relative
          p-6 sm:p-8 md:p-10
          bg-black/40
          backdrop-blur-xl
          border border-white/10
          rounded-3xl
          shadow-[0_25px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
        "
      >
        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8">
          {GRID_COLORS.map((color) => (
            <GlassButton
              key={color}
              color={color}
              isActive={activeColor === color}
              onClick={() => handleColorClick(color)}
              disabled={!demoMode && (disabled || isShowingSequence || !isInputPhase)}
              size="xl"
            />
          ))}
        </div>

        {/* Center HUD Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="
              bg-black/60
              backdrop-blur-md
              border border-white/15
              rounded-full
              w-20 h-20 sm:w-24 sm:h-24
              flex flex-col items-center justify-center
              shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)]
            "
          >
            {demoMode ? (
              <span className="text-white/80 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">
                Simon
              </span>
            ) : (
              <>
                <span className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider">
                  {isShowingSequence ? 'Watch' : isInputPhase ? 'Play' : ''}
                </span>
                <span className="text-white text-xl sm:text-2xl font-bold">{round}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player sequence indicator - only show in game mode during input */}
      {!demoMode && isInputPhase && playerSequence.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          {playerSequence.map((color, idx) => (
            <div
              key={idx}
              className={`
                w-3 h-3 rounded-full
                ${color === 'green' ? 'bg-green-400' : ''}
                ${color === 'red' ? 'bg-red-400' : ''}
                ${color === 'yellow' ? 'bg-yellow-400' : ''}
                ${color === 'blue' ? 'bg-blue-400' : ''}
              `}
            />
          ))}
          <span className="text-gray-400 text-xs ml-2">
            {playerSequence.length}/{sequence.length}
          </span>
        </div>
      )}

      {/* Demo mode label */}
      {demoMode && (
        <div className="text-center text-gray-500 text-sm">
          <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
            👆 Click the buttons to test
          </span>
        </div>
      )}
    </div>
  );
};

export default JellySimonBoard;
