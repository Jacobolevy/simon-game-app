/**
 * NewHighScoreModal Component
 * 
 * Epic celebration when player achieves a new high score!
 */

import React, { useEffect, useState } from 'react';
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

  // Trigger celebration effects
  useEffect(() => {
    if (isOpen) {
      // Start confetti after modal appears
      setTimeout(() => setShowConfetti(true), 300);
      
      // Haptic feedback
      hapticService.vibrateNewHighScore();
      
      // Sound fanfare
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-yellow-900/40 via-black/80 to-purple-900/40"
      />
      
      {/* Confetti Layer */}
      {showConfetti && <ConfettiEffect />}
      
      {/* Firework Bursts */}
      {showConfetti && <FireworkBursts />}
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-sm
          bg-gradient-to-b from-yellow-600/30 to-purple-900/40
          backdrop-blur-xl rounded-3xl
          border-2 border-yellow-500/50
          shadow-2xl
          p-8
          ${modalClass}
        `}
        style={{
          boxShadow: '0 0 60px rgba(234, 179, 8, 0.3), 0 0 100px rgba(168, 85, 247, 0.2)',
        }}
      >
        {/* Trophy Icon */}
        <div className="text-center mb-4">
          <span 
            className="text-7xl inline-block animate-bounce"
            style={{ animationDuration: '1s' }}
          >
            🏆
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 
            className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-1"
          >
            NEW HIGH SCORE!
          </h2>
          <p className="text-yellow-200/60 text-sm">
            You crushed your previous record!
          </p>
        </div>

        {/* Score Display */}
        <div className="text-center mb-6">
          <RetroCounter 
            value={score}
            duration={2500}
            onComplete={() => setCountingDone(true)}
            size="xl"
            showFlash={true}
          />
          
          {/* Improvement Badge */}
          {countingDone && previousHighScore > 0 && (
            <div 
              className="
                inline-block mt-3 py-1.5 px-4
                bg-green-500/20 rounded-full
                text-green-400 text-sm font-medium
                animate-in fade-in slide-in-from-bottom-2 duration-300
              "
            >
              +{improvement.toLocaleString()} points!
            </div>
          )}
        </div>

        {/* Stats */}
        {countingDone && (
          <div 
            className="
              grid grid-cols-2 gap-4 mb-6
              animate-in fade-in slide-in-from-bottom-4 duration-500
            "
            style={{ animationDelay: '200ms' }}
          >
            <StatBox label="Previous Best" value={previousHighScore} />
            <StatBox label="Improvement" value={`+${improvement}`} highlight />
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="
            w-full py-4 px-6
            bg-gradient-to-r from-yellow-500 to-amber-600
            hover:from-yellow-400 hover:to-amber-500
            rounded-2xl font-bold text-lg text-black
            transition-all duration-200
            active:scale-95
            shadow-lg shadow-yellow-500/30
          "
        >
          Continue
        </button>

        {/* Share Options (future feature) */}
        {countingDone && (
          <div 
            className="
              text-center mt-4 text-white/40 text-sm
              animate-in fade-in duration-500
            "
            style={{ animationDelay: '400ms' }}
          >
            Share your achievement! (Coming soon)
          </div>
        )}
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
        py-3 px-4 rounded-xl text-center
        ${highlight 
          ? 'bg-green-500/10 border border-green-500/30' 
          : 'bg-white/5 border border-white/10'
        }
      `}
    >
      <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
        {label}
      </p>
      <p className={`font-bold text-lg ${highlight ? 'text-green-400' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// =============================================================================
// CONFETTI EFFECT
// =============================================================================

function ConfettiEffect() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F59E0B', '#10B981'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
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
          className="absolute w-3 h-3 animate-confetti"
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
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// FIREWORK BURSTS
// =============================================================================

function FireworkBursts() {
  const bursts = [
    { id: 1, x: 20, y: 30, delay: 0.5 },
    { id: 2, x: 80, y: 25, delay: 1.2 },
    { id: 3, x: 50, y: 15, delay: 2.0 },
    { id: 4, x: 15, y: 60, delay: 2.8 },
    { id: 5, x: 85, y: 55, delay: 3.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute w-4 h-4 rounded-full animate-firework"
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
          0% {
            transform: scale(0);
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.8);
          }
          50% {
            transform: scale(3);
            opacity: 0.8;
            box-shadow: 0 0 40px 20px rgba(255, 215, 0, 0.4);
          }
          100% {
            transform: scale(6);
            opacity: 0;
            box-shadow: 0 0 60px 30px rgba(255, 215, 0, 0);
          }
        }
        .animate-firework {
          animation: firework 1s ease-out forwards;
          animation-iteration-count: 1;
        }
      `}</style>
    </div>
  );
}

export default NewHighScoreModal;
