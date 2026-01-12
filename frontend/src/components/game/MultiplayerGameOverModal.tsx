/**
 * MultiplayerGameOverModal Component
 * 
 * Displays multiplayer game results with:
 * - Winner celebration with confetti
 * - Final scoreboard with medals
 * - Animated score counting
 * - Play Again / Home buttons
 */

import { useEffect, useState } from 'react';
import { useAnimation } from '../../hooks/useAnimation';
import { RetroCounter } from '../ui/RetroCounter';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';

// =============================================================================
// TYPES
// =============================================================================

interface PlayerScore {
  playerId: string;
  name: string;
  score: number;
  isEliminated?: boolean;
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
  roundsPlayed: number;
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
  roundsPlayed,
  onPlayAgain,
  onGoHome,
  gameCode,
}: MultiplayerGameOverModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [scoreCountDone, setScoreCountDone] = useState(false);
  
  const { shouldRender, isEntering } = useAnimation(isOpen, {
    enterDuration: 500,
  });

  const isWinner = winner?.playerId === currentPlayerId;
  const isSoloGame = finalScores.length === 1;
  const myRank = finalScores.findIndex(s => s.playerId === currentPlayerId) + 1;
  const myScore = finalScores.find(s => s.playerId === currentPlayerId)?.score || 0;

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
    }
  }, [isOpen, isWinner]);

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
    const shareText = isSoloGame
      ? `🎮 I reached Round ${roundsPlayed} in Simon Says with ${myScore} points! Can you beat my score?`
      : `🏆 I finished #${myRank} in Simon Says with ${myScore} points! ${isWinner ? '👑 WINNER!' : ''}`;
    
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
          <h2 className="text-xl font-bold text-white tracking-tight">
            Game Over
          </h2>
        </div>

        {/* Winner Section */}
        {winner && (
          <div 
            className={`
              relative p-4 mb-3 text-center rounded-2xl overflow-hidden
              ${isWinner 
                ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/10 border border-yellow-400/30' 
                : 'bg-white/5 border border-white/10'
              }
            `}
          >
            {/* Crown */}
            <div className="text-3xl mb-1.5 animate-bounce">👑</div>
            
            <h3 className={`text-base font-bold mb-1 ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
              {isSoloGame ? 'GREAT JOB!' : 'WINNER!'}
            </h3>
            
            <div className="text-white text-sm font-semibold mb-2">
              {winner.name}
            </div>
            
            {/* Animated Score */}
            <RetroCounter 
              value={winner.score}
              duration={2000}
              onComplete={() => setScoreCountDone(true)}
              size="md"
            />
            
            {isWinner && !isSoloGame && (
              <div className="mt-2 text-green-400 text-xs font-semibold animate-pulse">
                ✨ That's YOU! ✨
              </div>
            )}
          </div>
        )}

        {/* Scoreboard (Multiplayer) */}
        {!isSoloGame && scoreCountDone && finalScores.length > 1 && (
          <div className="mb-3 p-3 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-white/60 text-xs uppercase tracking-wider text-center mb-3">
              Final Standings
            </h4>
            
            <div className="space-y-2">
              {finalScores.slice(0, 5).map((player, index) => {
                const isMe = player.playerId === currentPlayerId;
                const rank = index + 1;
                
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
                      {player.isEliminated && (
                        <span className="text-red-400 text-xs">💀</span>
                      )}
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox label="Rounds" value={roundsPlayed} />
          <StatBox label="Your Score" value={myScore} highlight={isWinner} />
          {!isSoloGame && <StatBox label="Rank" value={`#${myRank}`} />}
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
