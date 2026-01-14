/**
 * Waiting Room / Multiplayer Game Page - Simon 2026
 * 
 * MOBILE APP LAYOUT:
 * - Fixed viewport, no scrolling
 * - Compact spacing throughout
 * - App-scale typography
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSimonStore } from '../store/simonStore';
import { socketService } from '../services/socketService';
import { soundService } from '../services/soundService';
import { hapticService } from '../services/hapticService';

// Components
import { JellySimonBoard } from '../components/ui/glass';
import { MultiplayerGameOverModal } from '../components/game/MultiplayerGameOverModal';
import { Toast } from '../components/ui/Toast';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';
import { TimerBar } from '../components/ui/TimerBar';
import { AnimatedScore } from '../components/ui/AnimatedScore';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SoundOnIcon, SoundOffIcon, ExitIcon } from '../components/ui/icons/SoundIcons';
import { ProTipRotator } from '../components/ui/ProTipRotator';
import { RulesInfoModal } from '../components/ui/RulesInfoModal';

// =============================================================================
// COMPONENT
// =============================================================================

export function WaitingRoomPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAuthStore();
  const gameCode = session?.gameCode;
  const playerId = session?.playerId;
  
  const { 
    isMatchActive, 
    currentSequence, 
    isShowingSequence,
    isInputPhase,
    playerSequence,
    canSubmit,
    message,
    secondsRemaining,
    scores,
    isGameOver,
    winner,
    standings,
    initializeListeners,
    cleanup,
    addColorToSequence,
    submitSequence,
    resetGame,
    turnTotalSeconds,
    currentTurnPlayerId,
    currentTurnPlayerName,
    isMyTurn,
    lastEarned,
  } = useSimonStore();
  
  // Local state
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'active'>('waiting');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(session?.isHost || false);
  const [players, setPlayers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [turnSeconds, setTurnSeconds] = useState<30 | 60 | 90>(60);
  const [showRules, setShowRules] = useState(false);
  
  const lastCountdownValue = useRef<number | null>(null);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  useEffect(() => {
    console.log('🎮 WaitingRoomPage mounted');
    
    const socket = socketService.connect();
    if (playerId) {
      initializeListeners(playerId);
    }
    
    if (gameCode && playerId) {
      socket.emit('join_room_socket', { gameCode, playerId });
    }
    
    socket.once('room_state', (room: any) => {
      console.log('📦 Initial room state:', room);
      setPlayers(room.players || []);
      setRoomStatus(room.status);
      
      const me = room.players?.find((p: any) => p.id === playerId);
      setIsHost(me?.isHost || false);
    });
    
    socket.on('room_state_update', (room: any) => {
      setPlayers(room.players || []);
      setRoomStatus(room.status);
      
      const me = room.players?.find((p: any) => p.id === playerId);
      setIsHost(me?.isHost || false);
    });
    
    socket.on('error', (data: { message: string }) => {
      console.error('❌ Server error:', data.message);
      setToast({ message: data.message, type: 'error' });
    });
    
    socket.on('countdown', (data: { count: number }) => {
      setRoomStatus('countdown');
      setCountdownValue(data.count);
      
      if (lastCountdownValue.current !== data.count) {
        soundService.playCountdown(data.count);
        hapticService.vibrateToggle();
        lastCountdownValue.current = data.count;
      }
      
      if (data.count === 0) {
        setRoomStatus('active');
        setCountdownValue(null);
        lastCountdownValue.current = null;
      }
    });
    
    socket.on('player_left', (data: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });
    
    socket.on('game_restarted', () => {
      resetGame();
      setRoomStatus('waiting');
      setShowGameOver(false);
      lastCountdownValue.current = null;
    });
    
    return () => {
      cleanup();
      socket.off('room_state');
      socket.off('room_state_update');
      socket.off('error');
      socket.off('countdown');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_restarted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode, playerId]);

  useEffect(() => {
    if (isGameOver) {
      setShowGameOver(true);
    }
  }, [isGameOver]);

  useEffect(() => {
    if (!canSubmit || !isInputPhase || !gameCode || !playerId) return;
    submitSequence(gameCode, playerId);
  }, [canSubmit, isInputPhase, gameCode, playerId, submitSequence]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  
  const handleStartGame = useCallback(async () => {
    await soundService.init();
    
    const socket = socketService.getSocket();
    if (!socket || !gameCode || !playerId) {
      setToast({ message: 'Connection error', type: 'error' });
      return;
    }
    
    socket.emit('start_game', { gameCode, playerId, turnTotalSeconds: turnSeconds });
  }, [gameCode, playerId, turnSeconds]);

  const handleColorClick = useCallback((color: any) => {
    if (!isMyTurn || !isInputPhase || isShowingSequence) return;
    
    hapticService.vibrateColor(color);
    addColorToSequence(color);
  }, [isMyTurn, isInputPhase, isShowingSequence, addColorToSequence]);
  
  const handlePlayAgain = useCallback(() => {
    resetGame();
    setRoomStatus('waiting');
    setShowGameOver(false);
    
    const socket = socketService.getSocket();
    if (socket && gameCode && playerId) {
      socket.emit('restart_game', { gameCode, playerId });
    }
  }, [resetGame, gameCode, playerId]);

  const handleGoHome = useCallback(() => {
    cleanup();
    clearSession();
    navigate('/');
  }, [cleanup, clearSession, navigate]);

  const handleExitClick = useCallback(() => {
    if (roomStatus === 'active' && !isGameOver) {
      setShowExitConfirm(true);
    } else {
      handleGoHome();
    }
  }, [roomStatus, isGameOver, handleGoHome]);

  const handleToggleSound = useCallback(() => {
    const newMuted = soundService.toggleMute();
    setIsMuted(newMuted);
    hapticService.vibrateToggle();
  }, []);

  const copyGameCode = useCallback(async () => {
    if (!gameCode) return;
    try {
      await navigator.clipboard.writeText(gameCode);
      setToast({ message: 'Copied!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy', type: 'error' });
    }
  }, [gameCode]);

  const shareGame = useCallback(async () => {
    if (!gameCode) return;
    const inviteUrl = `${window.location.origin}/?join=${gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Simon Game!',
          text: `Join me in Simon Says! Code: ${gameCode}`,
          url: inviteUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(inviteUrl);
          setToast({ message: 'Link copied!', type: 'success' });
        }
      }
    } else {
      await navigator.clipboard.writeText(inviteUrl);
      setToast({ message: 'Link copied!', type: 'success' });
    }
  }, [gameCode]);

  // ==========================================================================
  // RENDER: GAME OVER
  // ==========================================================================
  
  if (showGameOver && isGameOver) {
    return (
      <MultiplayerGameOverModal
        isOpen={showGameOver}
        winner={winner}
        finalScores={standings as any}
        currentPlayerId={playerId || ''}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        gameCode={gameCode || ''}
      />
    );
  }

  // ==========================================================================
  // RENDER: ACTIVE GAME
  // ==========================================================================
  
  if (roomStatus === 'active' && isMatchActive) {
    const sortedPlayers = [...players].sort((a, b) => 
      (scores[b.id] || 0) - (scores[a.id] || 0)
    );

    return (
      <AppShell variant="jelly">
        {/* Compact Header */}
        <header className="mb-1">
          <GlassSurface className="p-2 rounded-xl">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              {sortedPlayers.slice(0, 4).map((player, idx) => {
                const score = scores[player.id] || 0;
                const isMe = player.id === playerId;
                const isCurrent = player.id === currentTurnPlayerId;
                
                return (
                  <div 
                    key={player.id}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-lg
                      ${isCurrent ? 'bg-green-500/15 border border-green-400/30' : isMe ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5'}
                    `}
                  >
                    <span className="text-xs">{idx === 0 ? '👑' : player.avatar || '😀'}</span>
                    <div className="flex flex-col">
                      <span className="text-white text-[10px] font-medium truncate max-w-[50px]">
                        {player.displayName}
                      </span>
                      <AnimatedScore score={score} size="sm" theme={isMe ? 'gold' : 'default'} />
                    </div>
                    {isCurrent && (
                      <span className="text-green-300 text-[10px] font-semibold">●</span>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassSurface>

          {secondsRemaining > 0 && (
            <div className="mt-1">
              <TimerBar 
                timeRemaining={secondsRemaining} 
                totalTime={turnTotalSeconds || secondsRemaining}
                showNumber={true}
              />
            </div>
          )}
        </header>

        {/* Contextual “why points?” hint */}
        {lastEarned && (
          <div className="mb-1 py-1.5 px-3 bg-black/25 border border-white/10 rounded-xl text-center">
            <span className="text-white/70 text-[11px]">
              ⚡ Speed: +{lastEarned.speedPoints} × {lastEarned.multiplier} = <span className="text-white font-semibold">+{lastEarned.earned}</span>
            </span>
          </div>
        )}

        {/* Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center min-h-0">
          <JellySimonBoard
            sequence={currentSequence}
            isShowingSequence={isShowingSequence}
            isInputPhase={isMyTurn && isInputPhase}
            playerSequence={playerSequence}
            onColorClick={handleColorClick}
            round={Math.max(1, currentSequence.length)}
            disabled={!isMyTurn}
          />
          
          <div className="mt-2 text-center">
            <p className="text-white/70 text-xs">{message}</p>
          </div>
        </main>

        {/* Compact Footer */}
        <footer className="flex items-center justify-between py-1">
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
          >
            {isMuted ? <SoundOffIcon size={18} /> : <SoundOnIcon size={18} />}
          </button>

          <GlassSurface className="px-3 py-1.5 rounded-xl">
            {isShowingSequence ? (
              <span className="text-yellow-300 font-medium text-xs animate-pulse">👀 Watch!</span>
            ) : isMyTurn && isInputPhase ? (
              <span className="text-cyan-300 font-medium text-xs">🎯 {playerSequence.length}/{currentSequence.length}</span>
            ) : (
              <span className="text-white/70 text-xs">👤 {currentTurnPlayerName || '...'}</span>
            )}
          </GlassSurface>

          <button
            onClick={handleExitClick}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
          >
            <ExitIcon size={18} />
          </button>
        </footer>

        <ConfirmModal
          isOpen={showExitConfirm}
          title="Leave Game?"
          message="You'll be removed from this game."
          confirmText="Leave"
          cancelText="Stay"
          onConfirm={handleGoHome}
          onCancel={() => setShowExitConfirm(false)}
          danger
        />

        <RulesInfoModal isOpen={showRules} variant="multiplayer" onClose={() => setShowRules(false)} />
      </AppShell>
    );
  }
  
  // ==========================================================================
  // RENDER: COUNTDOWN
  // ==========================================================================
  
  if (roomStatus === 'countdown' && countdownValue !== null) {
    return (
      <AppShell variant="jelly" className="justify-center items-center">
        <div className="text-center">
          <div className="text-white/60 text-[10px] uppercase tracking-wider mb-2">
            Game starts in
          </div>
          <div 
            className="text-6xl font-black text-white"
            style={{
              textShadow: '0 0 30px rgba(255,255,255,0.3)',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            {countdownValue}
          </div>
          <div className="mt-3 text-white/60 text-sm">Get ready!</div>
        </div>
      </AppShell>
    );
  }
  
  // ==========================================================================
  // RENDER: WAITING ROOM
  // ==========================================================================
  
  return (
    <AppShell variant="jelly" className="justify-center">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <GlassSurface className="p-4 w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Waiting Room
          </h1>
          <p className="text-xs text-white/55 mt-1">
            Invite friends, then start when ready.
          </p>
        </div>
        
        {/* Game Code */}
        <div className="mb-4">
          <div className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2.5">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-white/50">
                Game code
              </div>
              <div className="font-mono text-base tracking-widest text-white">
                {gameCode}
              </div>
            </div>
            <button
              onClick={copyGameCode}
              className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium px-2.5 py-1.5 transition-colors active:scale-95"
            >
              Copy
            </button>
          </div>
          
          {/* Share Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?join=${gameCode}`).then(() => setToast({ message: 'Link copied!', type: 'success' }))}
              className="flex-1 bg-white/10 hover:bg-white/15 text-white font-medium py-2 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs border border-white/10"
            >
              🔗 Copy link
            </button>
            
            <button
              onClick={shareGame}
              className="flex-1 bg-white text-slate-900 hover:bg-gray-50 font-semibold py-2 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs"
            >
              📤 Share
            </button>
          </div>
        </div>
        
        {/* Players List - Compact */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
              Players
            </h2>
            <span className="text-xs text-white/60">{players.length}</span>
          </div>

          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {players.map(player => (
              <div 
                key={player.id} 
                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{player.avatar || '😀'}</span>
                  <span className="font-medium text-sm text-white">
                    {player.displayName}
                    {player.id === playerId && (
                      <span className="text-white/50 font-normal text-xs ml-1">(you)</span>
                    )}
                  </span>
                </div>
                {player.isHost && <span className="text-yellow-300 text-sm">👑</span>}
              </div>
            ))}
          </div>
        </div>
        
        {/* Start Button */}
        {(isHost || players.length === 1) && (
          <>
            {players.length === 1 && (
              <p className="text-center text-[10px] text-white/55 mb-2">
                💡 Start solo, or wait for others.
              </p>
            )}
            {/* Host: choose turn timer (turn-based showmatch) */}
            {isHost && players.length > 1 && (
              <div className="mb-2">
                <div className="text-[9px] uppercase tracking-wider text-white/50 mb-1">
                  Turn timer
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([30, 60, 90] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTurnSeconds(s)}
                      className={[
                        'h-9 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]',
                        turnSeconds === s ? 'bg-white text-slate-900 border-white/20' : 'bg-white/5 text-white border-white/10 hover:bg-white/10',
                      ].join(' ')}
                      style={{ touchAction: 'manipulation' }}
                      aria-pressed={turnSeconds === s}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-green-500/20"
            >
              🎮 {players.length === 1 ? 'Start Solo' : 'Start Game'}
            </button>
          </>
        )}
        
        {!isHost && players.length > 1 && (
          <p className="text-center text-white/55 text-xs">
            Waiting for host to start...
          </p>
        )}

        <button
          onClick={handleGoHome}
          className="w-full mt-2 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs"
        >
          ← Back to Home
        </button>

        {/* Contextual learning */}
        <div className="mt-3 space-y-2">
          <ProTipRotator
            tips={[
              'Each player gets one timed turn. Watch others to learn their rhythm.',
              'Speed matters: finishing sequences with more time left scores more.',
              'Patterns are different per player (same difficulty), so watching helps — but doesn’t spoil your turn.',
            ]}
          />
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold transition-all active:scale-[0.98]"
            style={{ touchAction: 'manipulation' }}
          >
            ℹ️ How it works
          </button>
        </div>
      </GlassSurface>

      <ConfirmModal
        isOpen={showExitConfirm}
        title="Leave Room?"
        message="You'll need a new code to rejoin."
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={handleGoHome}
        onCancel={() => setShowExitConfirm(false)}
        danger
      />

      <RulesInfoModal isOpen={showRules} variant="multiplayer" onClose={() => setShowRules(false)} />
    </AppShell>
  );
}

export default WaitingRoomPage;
