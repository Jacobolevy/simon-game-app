/**
 * Jelly Simon Board - Compact Mobile App Version
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Color } from '../../../shared/types';
import { GlassButton } from './GlassButton';

export interface JellySimonBoardProps {
  sequence?: Color[];
  isShowingSequence?: boolean;
  isInputPhase?: boolean;
  playerSequence?: Color[];
  onColorClick?: (color: Color) => void;
  disabled?: boolean;
  round?: number;
  demoMode?: boolean;
  /**
   * Force specific buttons to light up (used for retro score "all flash" / "green flash").
   * When provided, this overrides the internal activeColor during render.
   */
  forcedActiveColors?: Color[] | null;
}

const GRID_COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];

export const JellySimonBoard: React.FC<JellySimonBoardProps> = ({
  sequence = [],
  isShowingSequence = false,
  isInputPhase = true,
  playerSequence = [],
  onColorClick,
  disabled = false,
  round = 1,
  demoMode = false,
  forcedActiveColors = null,
}) => {
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo mode: cycle through colors
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
    <div className="flex flex-col items-center gap-3">
      {/* Board Container - Compact */}
      <div 
        className="
          relative
          p-4
          bg-black/40
          backdrop-blur-xl
          border border-white/10
          rounded-2xl
          shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
        "
      >
        {/* 2x2 Grid - Compact gaps */}
        <div className="grid grid-cols-2 gap-4">
          {GRID_COLORS.map((color) => (
            <GlassButton
              key={color}
              color={color}
              isActive={forcedActiveColors ? forcedActiveColors.includes(color) : activeColor === color}
              onClick={() => handleColorClick(color)}
              disabled={!demoMode && (disabled || isShowingSequence || !isInputPhase)}
              size="lg"
            />
          ))}
        </div>

        {/* Center HUD - Compact */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="
              bg-black/60
              backdrop-blur-md
              border border-white/15
              rounded-full
              w-14 h-14
              flex flex-col items-center justify-center
              shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)]
            "
          >
            {demoMode ? (
              <span className="text-white/80 text-[8px] font-bold tracking-[0.15em] uppercase">
                Simon
              </span>
            ) : (
              <>
                <span className="text-white/50 text-[7px] uppercase tracking-wider">
                  {isShowingSequence ? 'Watch' : isInputPhase ? 'Play' : ''}
                </span>
                <span className="text-white text-base font-bold">{round}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sequence indicator - Compact */}
      {!demoMode && isInputPhase && playerSequence.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
          {playerSequence.map((color, idx) => (
            <div
              key={idx}
              className={`
                w-2 h-2 rounded-full
                ${color === 'green' ? 'bg-green-400' : ''}
                ${color === 'red' ? 'bg-red-400' : ''}
                ${color === 'yellow' ? 'bg-yellow-400' : ''}
                ${color === 'blue' ? 'bg-blue-400' : ''}
              `}
            />
          ))}
          <span className="text-gray-400 text-[10px] ml-1">
            {playerSequence.length}/{sequence.length}
          </span>
        </div>
      )}

      {demoMode && (
        <div className="text-center text-gray-500 text-xs">
          <span className="px-2 py-1 bg-white/5 rounded-full border border-white/10">
            👆 Tap to test
          </span>
        </div>
      )}
    </div>
  );
};

export default JellySimonBoard;
