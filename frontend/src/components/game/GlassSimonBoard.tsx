/**
 * Glass Simon Board Component - Simon 2026
 * 
 * Glassmorphism styled Simon board with 2x2 grid layout.
 * This is an ISOLATED component for preview/testing.
 * 
 * To use: Import and swap with existing SimonBoard in WaitingRoomPage
 * when ready for production.
 */

import { useState, useEffect, useRef } from 'react';
import type { Color } from '../../shared/types';
import { GlassColorButton } from './GlassColorButton';
import { soundService } from '../../services/soundService';

// =============================================================================
// TYPES
// =============================================================================

interface GlassSimonBoardProps {
  sequence: Color[];
  round: number;
  isShowingSequence: boolean;
  isInputPhase: boolean;
  playerSequence: Color[];
  lastResult: { isCorrect: boolean; playerName: string } | null;
  onColorClick: (color: Color) => void;
  disabled?: boolean;
  secondsRemaining: number;
  timerColor: 'green' | 'yellow' | 'red';
  isTimerPulsing: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const GlassSimonBoard: React.FC<GlassSimonBoardProps> = ({
  sequence,
  round,
  isShowingSequence,
  isInputPhase,
  playerSequence,
  onColorClick,
  disabled = false,
  secondsRemaining,
  timerColor,
  isTimerPulsing,
}) => {
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const audioInitialized = useRef(false);

  // Color order for the 2x2 grid
  const colorOrder: Color[] = ['green', 'red', 'yellow', 'blue'];

  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      if (!audioInitialized.current) {
        await soundService.init();
        audioInitialized.current = true;
      }
    };
    initAudio();
  }, []);

  // Animate sequence when showing
  useEffect(() => {
    if (!isShowingSequence || sequence.length === 0) {
      setActiveColor(null);
      return;
    }

    const SHOW_DURATION = 600;
    const SHOW_GAP = 200;
    
    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const showNextColor = () => {
      if (isCancelled || currentIndex >= sequence.length) {
        setActiveColor(null);
        return;
      }

      const color = sequence[currentIndex];
      setActiveColor(color);
      
      // Play sound
      soundService.playColor(color, SHOW_DURATION / 1000);

      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

      setTimeout(() => {
        if (isCancelled) return;
        setActiveColor(null);
        currentIndex++;
        
        if (!isCancelled && currentIndex < sequence.length) {
          timeoutId = setTimeout(showNextColor, SHOW_GAP);
        }
      }, SHOW_DURATION);
    };

    timeoutId = setTimeout(showNextColor, 500);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      setActiveColor(null);
    };
  }, [isShowingSequence, sequence]);

  // Handle color button click
  const handleColorClick = (color: Color) => {
    if (disabled || isShowingSequence || !isInputPhase) return;
    if (playerSequence.length >= sequence.length) return;

    soundService.playColorClick(color);

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 150);
    onColorClick(color);
  };

  // Get color emoji
  const getColorEmoji = (color: Color): string => {
    const emojis: Record<Color, string> = {
      red: '🔴',
      blue: '🔵',
      yellow: '🟡',
      green: '🟢',
    };
    return emojis[color];
  };

  return (
    <div className="game-area flex flex-col items-center gap-3 w-full h-full">
      {/* Round Display */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-white mb-1 tracking-wide">
          ROUND <span className="neon-text neon-text--blue">{round}</span>
        </h2>
        
        {isShowingSequence ? (
          <div className="glass-panel px-4 py-2 animate-pulse">
            <p className="text-yellow-300 font-bold text-sm neon-text neon-text--yellow">
              👀 MEMORIZE!
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            {disabled 
              ? '👻 Spectating...' 
              : isInputPhase
                ? '🎮 Your turn!' 
                : '✅ Ready'}
          </p>
        )}
      </div>

      {/* Timer Display */}
      {isInputPhase && secondsRemaining > 0 && (
        <div className="glass-panel px-5 py-3">
          <div 
            className={`
              font-mono font-bold transition-all duration-200 text-center
              ${secondsRemaining > 10 ? 'text-3xl' : ''}
              ${secondsRemaining > 5 && secondsRemaining <= 10 ? 'text-4xl' : ''}
              ${secondsRemaining <= 5 ? 'text-5xl' : ''}
              ${timerColor === 'green' ? 'text-green-400 neon-text--green' : ''}
              ${timerColor === 'yellow' ? 'text-yellow-400 neon-text--yellow' : ''}
              ${timerColor === 'red' ? 'text-red-400 neon-text--red' : ''}
              ${isTimerPulsing ? 'animate-pulse neon-text' : ''}
            `}
          >
            {secondsRemaining}
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">SECONDS</p>
        </div>
      )}

      {/* Glass Simon Board - 2x2 Grid */}
      <div className="glass-container p-5 relative">
        <div className="grid grid-cols-2 gap-4">
          {colorOrder.map((color) => (
            <GlassColorButton
              key={color}
              color={color}
              isActive={activeColor === color}
              onClick={() => handleColorClick(color)}
              disabled={disabled || isShowingSequence || !isInputPhase}
              size="lg"
            />
          ))}
        </div>
        
        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass-panel px-4 py-2 opacity-60">
            <span className="text-white text-sm font-bold tracking-[0.3em]">SIMON</span>
          </div>
        </div>
      </div>

      {/* Player Sequence Display */}
      {isInputPhase && playerSequence.length > 0 && (
        <div className="glass-panel p-3 w-full max-w-xs">
          <div className="flex justify-center items-center gap-2 min-h-[32px]">
            {playerSequence.map((color, i) => (
              <span key={i} className="text-xl">
                {getColorEmoji(color)}
              </span>
            ))}
            <span className="text-gray-400 text-sm ml-3 font-mono">
              {playerSequence.length}/{sequence.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassSimonBoard;
