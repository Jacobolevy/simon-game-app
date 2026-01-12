/**
 * NewHighScoreModal - Compact Mobile App Style
 */

import { useEffect, useState } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { RetroCounter } from '../ui/RetroCounter';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';

interface NewHighScoreModalProps {
  isOpen: boolean;
  score: number;
  previousHighScore: number;
  onContinue: () => void;
}

export function NewHighScoreModal({
  isOpen,
  score,
  previousHighScore,
  onContinue,
}: NewHighScoreModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [countingDone, setCountingDone] = useState(false);
  
  const { shouldRender, isEntering } = useAnimation(isOpen, {
    enterDuration: 500,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowConfetti(true), 300);
      hapticService.vibrateNewHighScore();
      soundService.playHighScoreFanfare();
    } else {
      setShowConfetti(false);
      setCountingDone(false);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const improvement = score - previousHighScore;

  const modalClass = isEntering 
    ? 'animate-in fade-in zoom-in-90 duration-500' 
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        /* Respect safe areas (this modal is fixed and bypasses AppShell padding) */
        paddingTop: 'max(12px, calc(12px + env(safe-area-inset-top)))',
        paddingBottom: 'max(12px, calc(12px + env(safe-area-inset-bottom)))',
        paddingLeft: 'max(12px, calc(12px + env(safe-area-inset-left)))',
        paddingRight: 'max(12px, calc(12px + env(safe-area-inset-right)))',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/40 via-black/80 to-purple-900/40" />
      
      {/* Confetti */}
      {showConfetti && <ConfettiEffect />}
      {showConfetti && <FireworkBursts />}
      
      {/* Modal - Compact */}
      <div 
        className={`
          relative w-full max-w-[300px]
          bg-gradient-to-b from-yellow-600/30 to-purple-900/40
          backdrop-blur-xl rounded-2xl
          border-2 border-yellow-500/50
          shadow-2xl
          p-3.5
          overflow-hidden
          ${modalClass}
        `}
        style={{
          boxShadow: '0 0 40px rgba(234, 179, 8, 0.3), 0 0 80px rgba(168, 85, 247, 0.2)',
          /* Hard constraint: must fit on small phones with no scrolling */
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)',
        }}
      >
        {/* Trophy */}
        <div className="text-center mb-2">
          <span className="text-4xl inline-block animate-bounce" style={{ animationDuration: '1.1s' }}>
            🏆
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-0.5 leading-none">
            NEW HIGH SCORE!
          </h2>
          <p className="text-yellow-200/60 text-[11px] leading-snug">
            Record broken.
          </p>
        </div>

        {/* Score */}
        <div className="text-center mb-3">
          <RetroCounter 
            value={score}
            duration={2500}
            onComplete={() => setCountingDone(true)}
            size="md"
            showFlash={true}
          />
          
          {countingDone && previousHighScore > 0 && (
            <div className="inline-block mt-1 py-0.5 px-2 bg-green-500/20 rounded-full text-green-300 text-[11px] font-semibold">
              +{improvement.toLocaleString()} points!
            </div>
          )}
        </div>

        {/* Stats */}
        {countingDone && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatBox label="Previous" value={previousHighScore} />
            <StatBox label="Gained" value={`+${improvement}`} highlight />
          </div>
        )}

        {/* Continue */}
        <button
          onClick={onContinue}
          className="
            w-full px-4
            bg-gradient-to-r from-yellow-500 to-amber-600
            hover:from-yellow-400 hover:to-amber-500
            rounded-xl font-semibold text-sm text-black
            transition-all duration-200
            active:scale-95
            shadow-lg shadow-yellow-500/30
          "
          style={{ height: 'var(--app-btn-md)' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface StatBoxProps {
  label: string;
  value: number | string;
  highlight?: boolean;
}

function StatBox({ label, value, highlight = false }: StatBoxProps) {
  return (
    <div 
      className={`
        py-1.5 px-2.5 rounded-lg text-center
        ${highlight 
          ? 'bg-green-500/10 border border-green-500/30' 
          : 'bg-white/5 border border-white/10'
        }
      `}
    >
      <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">
        {label}
      </p>
      <p className={`font-semibold text-[13px] leading-none ${highlight ? 'text-green-300' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// =============================================================================
// CONFETTI
// =============================================================================

function ConfettiEffect() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F59E0B', '#10B981'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10px',
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100dvh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear infinite; }
      `}</style>
    </div>
  );
}

function FireworkBursts() {
  const bursts = [
    { id: 1, x: 20, y: 30, delay: 0.5 },
    { id: 2, x: 80, y: 25, delay: 1.2 },
    { id: 3, x: 50, y: 15, delay: 2.0 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute w-3 h-3 rounded-full animate-firework"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`,
            animationDelay: `${burst.delay}s`,
            background: 'radial-gradient(circle, #FFD700, transparent)',
          }}
        />
      ))}
      <style>{`
        @keyframes firework {
          0% { transform: scale(0); opacity: 1; box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.8); }
          50% { transform: scale(2); opacity: 0.8; box-shadow: 0 0 30px 15px rgba(255, 215, 0, 0.4); }
          100% { transform: scale(4); opacity: 0; box-shadow: 0 0 40px 20px rgba(255, 215, 0, 0); }
        }
        .animate-firework { animation: firework 1s ease-out forwards; animation-iteration-count: 1; }
      `}</style>
    </div>
  );
}

export default NewHighScoreModal;
