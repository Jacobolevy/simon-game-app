/**
 * MultiplayerGameOverModal Component
 * 
 * Displays multiplayer game results with:
 * - Winner celebration with confetti
 * - Final scoreboard with medals
 * - Animated score counting
 * - Play Again / Home buttons
 */

import { useEffect, useMemo, useState } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { JellySimonBoard } from '../ui/glass';

// =============================================================================
// TYPES
// =============================================================================

interface PlayerScore {
  playerId: string;
  name: string;
  score: number;
  rank?: number;
}

interface MultiplayerGameOverModalProps {
  isOpen: boolean;
  winner: {
    playerId: string;
    name: string;
    score: number;
  } | null;
  finalScores: PlayerScore[];
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameCode: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MultiplayerGameOverModal({
  isOpen,
  winner,
  finalScores,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
  gameCode,
}: MultiplayerGameOverModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [scoreCountDone, setScoreCountDone] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [forcedActiveColors, setForcedActiveColors] = useState<import('../../shared/types').Color[] | null>(null);
  
  const { shouldRender, isEntering } = useAnimation(isOpen, {
    enterDuration: 500,
  });

  const isWinner = winner?.playerId === currentPlayerId;
  const myEntry = useMemo(() => finalScores.find(s => s.playerId === currentPlayerId) || null, [finalScores, currentPlayerId]);
  const myRank = myEntry?.rank ?? (finalScores.findIndex(s => s.playerId === currentPlayerId) + 1);
  const myScore = myEntry?.score ?? 0;
  const winnerScore = winner?.score ?? 0;

  const message = useMemo(() => {
    if (!winner) return 'Game Over';
    if (isWinner) return 'WINNER!';
    if (winnerScore <= 0) return 'Good game';
    const ratio = myScore / winnerScore;
    if (ratio >= 0.95) return 'You were this close.';
    if (ratio >= 0.85) return 'Photo finish.';
    if (ratio >= 0.7) return 'Great run.';
    if (ratio >= 0.5) return 'Nice try.';
    return 'Keep practicing.';
  }, [winner, isWinner, myScore, winnerScore]);

  // Trigger effects when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowConfetti(true), 300);
      
      if (isWinner) {
        hapticService.vibrateNewHighScore();
        soundService.playVictory();
      } else {
        soundService.playEliminated();
      }
      
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setScoreCountDone(false);
      setDisplayScore(0);
      setForcedActiveColors(null);
    }
  }, [isOpen, isWinner]);

  // Retro score count (ALL flash = big step, GREEN flash = fine step)
  useEffect(() => {
    if (!isOpen) return;
    const target = Math.max(0, myScore);
    setDisplayScore(0);
    setScoreCountDone(false);

    // Limit flashes: choose step in multiples of 100 to keep count <= ~28
    const maxAllFlashes = 28;
    const step = Math.max(100, Math.ceil(target / maxAllFlashes / 100) * 100);
    const bigTarget = Math.floor(target / step) * step;
    const remainder = target - bigTarget;

    let cancelled = false;

    const flash = (colors: import('../../shared/types').Color[], ms: number) => {
      setForcedActiveColors(colors);
      setTimeout(() => setForcedActiveColors(null), ms);
    };

    const run = async () => {
      // Big jumps (ALL)
      const bigSteps = step > 0 ? bigTarget / step : 0;
      const bigDelay = Math.max(35, Math.floor(1400 / Math.max(1, bigSteps))); // ~1.4s budget
      for (let i = 0; i < bigSteps; i++) {
        if (cancelled) return;
        setDisplayScore((prev) => prev + step);
        flash(['green', 'red', 'yellow', 'blue'], Math.min(140, bigDelay));
        // low BUM-like haptic
        hapticService.vibrateToggle();
        await new Promise(r => setTimeout(r, bigDelay));
      }

      // Tens (GREEN) if step > 100 and remainder is large
      let remaining = remainder;
      const tens = step > 100 ? Math.floor(remaining / 10) * 10 : 0;
      const tensSteps = tens > 0 ? tens / 10 : 0;
      const tensDelay = tensSteps > 0 ? Math.max(12, Math.floor(700 / tensSteps)) : 0; // ~0.7s budget
      for (let i = 0; i < tensSteps; i++) {
        if (cancelled) return;
        setDisplayScore((prev) => prev + 10);
        flash(['green'], 80);
        await new Promise(r => setTimeout(r, tensDelay));
      }
      remaining = remaining - tens;

      // Units (GREEN)
      const unitDelay = remaining > 0 ? Math.max(8, Math.floor(700 / remaining)) : 0; // ~0.7s budget
      for (let i = 0; i < remaining; i++) {
        if (cancelled) return;
        setDisplayScore((prev) => prev + 1);
        flash(['green'], 70);
        await new Promise(r => setTimeout(r, unitDelay));
      }

      if (!cancelled) setScoreCountDone(true);
    };

    run();
    return () => { cancelled = true; };
  }, [isOpen, myScore]);

  if (!shouldRender) return null;

  // Get medal emoji based on rank
  const getMedal = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  // Share score functionality
  const handleShare = async () => {
    const shareText = `🏆 I finished #${myRank} in Simon Says with ${myScore} points! ${isWinner ? '👑 WINNER!' : ''}`;
    
    const shareUrl = `${window.location.origin}/?join=${gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Simon Says Score',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareText + '\n' + shareUrl);
        }
      }
    } else {
      navigator.clipboard.writeText(shareText + '\n' + shareUrl);
    }
  };

  const modalClass = isEntering 
    ? 'animate-in fade-in zoom-in-90 duration-500' 
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        /* This modal is fixed and bypasses AppShell padding. Respect safe areas. */
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Background */}
      <div 
        className={`
          absolute inset-0 
          ${isWinner 
            ? 'bg-gradient-to-b from-yellow-900/40 via-black/80 to-amber-900/30' 
            : 'bg-gradient-to-b from-gray-900/60 via-black/80 to-gray-900/60'
          }
          backdrop-blur-sm
        `}
      />
      
      {/* Confetti */}
      {showConfetti && isWinner && <ConfettiEffect />}
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-xs
          bg-gradient-to-b 
          ${isWinner 
            ? 'from-yellow-600/20 to-amber-900/30 border-yellow-500/40' 
            : 'from-white/10 to-white/5 border-white/20'
          }
          backdrop-blur-xl rounded-3xl
          border shadow-2xl
          p-4
          ${modalClass}
        `}
        style={{
          /* Hard constraint: must fit on small phones with no scrolling */
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)',
        }}
      >
        {/* Title */}
        <div className="text-center mb-3">
          <h2 className={`text-xl font-black tracking-tight ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
            {message}
          </h2>
          {winner && !isWinner && (
            <div className="text-white/60 text-xs mt-1">
              Winner: <span className="text-white/85 font-semibold">{winner.name}</span>
            </div>
          )}
        </div>

        {/* Retro Score Board (Simon homage) */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/60 text-[10px] uppercase tracking-wider">
              {isWinner ? 'Your score' : `Your score (#${myRank})`}
            </div>
            <button
              type="button"
              onClick={() => { setDisplayScore(myScore); setScoreCountDone(true); }}
              className="text-white/60 hover:text-white text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 active:scale-95 transition-all"
            >
              Skip
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className="font-mono font-black tabular-nums text-red-400 text-3xl tracking-widest"
              style={{ textShadow: '0 0 18px rgba(248, 113, 113, 0.55)' }}
            >
              {String(displayScore).padStart(4, '0')}
            </div>

            <JellySimonBoard
              demoMode={false}
              disabled={true}
              isShowingSequence={false}
              isInputPhase={false}
              sequence={[]}
              playerSequence={[]}
              round={1}
              forcedActiveColors={forcedActiveColors}
            />

            <div className="text-white/55 text-[10px] text-center leading-snug">
              All lights = big points. Green = fine points.
            </div>
          </div>
        </div>

        {/* Scoreboard (Multiplayer) */}
        {scoreCountDone && finalScores.length > 1 && (
          <div className="mb-3 p-3 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-white/60 text-xs uppercase tracking-wider text-center mb-3">
              Final Standings
            </h4>
            
            <div className="space-y-2">
              {finalScores.slice(0, 5).map((player, index) => {
                const isMe = player.playerId === currentPlayerId;
                const rank = player.rank ?? (index + 1);
                
                return (
                  <div
                    key={player.playerId}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-xl
                      ${isMe 
                        ? 'bg-blue-500/20 border border-blue-400/30' 
                        : 'bg-white/5'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg w-8">{getMedal(rank)}</span>
                      <span className="text-white font-medium text-sm">
                        {player.name}
                        {isMe && <span className="text-blue-300 text-xs ml-1">(you)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {player.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {finalScores.length > 5 && (
              <div className="mt-2 text-center text-[10px] text-white/40">
                +{finalScores.length - 5} more
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatBox label="Your Score" value={myScore} highlight={isWinner} />
          <StatBox label="Rank" value={`#${myRank || '-'}`} />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onPlayAgain}
            className="
              w-full px-4
              bg-gradient-to-r from-green-500 to-emerald-600
              hover:from-green-400 hover:to-emerald-500
              rounded-2xl font-bold text-white
              transition-all duration-200
              active:scale-95
              shadow-lg shadow-green-500/20
            "
            style={{ height: 'var(--app-btn-lg)' }}
          >
            Play Again
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onGoHome}
              className="
                flex-1 px-4
                bg-white/10 hover:bg-white/15
                rounded-xl font-medium text-white/80
                transition-all duration-200
                active:scale-95
              "
              style={{ height: 'var(--app-btn-md)' }}
            >
              Home
            </button>
            
            <button
              onClick={handleShare}
              className="
                flex-1 px-4
                bg-white/10 hover:bg-white/15
                rounded-xl font-medium text-white/80
                transition-all duration-200
                active:scale-95
              "
              style={{ height: 'var(--app-btn-md)' }}
            >
              Share
            </button>
          </div>
        </div>
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
        py-2 px-3 rounded-xl text-center
        ${highlight 
          ? 'bg-yellow-500/10 border border-yellow-500/30' 
          : 'bg-white/5 border border-white/10'
        }
      `}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">
        {label}
      </p>
      <p className={`font-bold text-base ${highlight ? 'text-yellow-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// CONFETTI EFFECT
// =============================================================================

function ConfettiEffect() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F59E0B', '#10B981'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10px',
            animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s infinite`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100dvh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MultiplayerGameOverModal;
