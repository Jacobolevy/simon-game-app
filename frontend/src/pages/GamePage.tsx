/**
 * Game Page - Simon 2026
 * 
 * MOBILE APP LAYOUT:
 * - Fixed viewport, no scrolling
 * - Compact header/footer
 * - Maximum space for game board
 * - App-scale typography and spacing
 */

import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Color } from '../shared/types';
import { JellySimonBoard } from '../components/ui/glass';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';

// New components
import { HeartDisplay } from '../components/ui/HeartDisplay';
import { AnimatedScore } from '../components/ui/AnimatedScore';
import { TimerBar } from '../components/ui/TimerBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { GameOverModal } from '../components/game/GameOverModal';
import { NewHighScoreModal } from '../components/game/NewHighScoreModal';
import { SoundOnIcon, SoundOffIcon, ExitIcon } from '../components/ui/icons/SoundIcons';

// Hooks
import { useHighScore } from '../hooks/useHighScore';
import { useGameTimer } from '../hooks/useGameTimer';

// Services
import { soundService } from '../services/soundService';
import { hapticService } from '../services/hapticService';
import { scoringService } from '../services/scoringService';
import { melodyService } from '../services/melodyService';
import { backgroundMusicService } from '../services/backgroundMusicService';
import { NOTE_FREQUENCIES } from '../data/melodies';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_LIVES = 3;
const STARTING_LIVES = 3;
const LIFE_REGEN_INTERVAL = 10;
const TIME_LIMIT = 30;

// =============================================================================
// COMPONENT
// =============================================================================

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { highScore, updateHighScore } = useHighScore();
  
  // Game state
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [isInputPhase, setIsInputPhase] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  // UI state
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showHighScoreCelebration, setShowHighScoreCelebration] = useState(false);
  const [heartAnimationIndex, setHeartAnimationIndex] = useState(-1);
  const [heartAnimationType, setHeartAnimationType] = useState<'lost' | 'gained' | 'none'>('none');
  
  // Track if this is a new high score
  const isNewHighScoreRef = useRef(false);
  const previousHighScoreRef = useRef(highScore);
  
  // Store sequence notes for melody playback
  const sequenceNotesRef = useRef<number[]>([]);
  
  // Timer
  const handleTimeUp = useCallback(() => {
    if (!isInputPhase || gameOver) return;
    
    hapticService.vibrateTimeout();
    soundService.playTimeout();
    loseLife();
  }, [isInputPhase, gameOver]);
  
  const { timeRemaining, resetTimer } = useGameTimer({
    timeLimit: TIME_LIMIT,
    onTimeUp: handleTimeUp,
    isActive: isInputPhase && gameStarted && !gameOver,
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  useEffect(() => {
    soundService.init();
    backgroundMusicService.init();
    
    return () => {
      backgroundMusicService.stop();
    };
  }, []);

  // ==========================================================================
  // LIFE MANAGEMENT
  // ==========================================================================
  
  const loseLife = useCallback(() => {
    setLives((prev) => {
      const newLives = prev - 1;
      
      setHeartAnimationIndex(newLives);
      setHeartAnimationType('lost');
      setTimeout(() => setHeartAnimationType('none'), 500);
      
      if (newLives <= 0) {
        setGameOver(true);
        setIsInputPhase(false);
        backgroundMusicService.stop();
        hapticService.vibrateGameOver();
        soundService.playEliminated();
        
        if (score > highScore) {
          isNewHighScoreRef.current = true;
          previousHighScoreRef.current = highScore;
          updateHighScore(score);
        }
        
        setTimeout(() => setShowGameOver(true), 500);
      } else {
        hapticService.vibrateLifeLost();
        
        setTimeout(() => {
          const nextSeq = [...sequence, getNextColor()];
          setSequence(nextSeq);
          setPlayerSequence([]);
          showSequence(nextSeq);
        }, 1000);
      }
      
      return newLives;
    });
  }, [highScore, score, sequence, updateHighScore]);
  
  const gainLife = useCallback(() => {
    setLives((prev) => {
      if (prev >= MAX_LIVES) return prev;
      
      const newLives = prev + 1;
      
      setHeartAnimationIndex(prev);
      setHeartAnimationType('gained');
      setTimeout(() => setHeartAnimationType('none'), 600);
      
      hapticService.vibrateLifeGained();
      
      return newLives;
    });
  }, []);

  // ==========================================================================
  // MELODY INTEGRATION
  // ==========================================================================
  
  const getNextColor = useCallback((): Color => {
    return melodyService.getNextColor(round);
  }, [round]);

  // ==========================================================================
  // SEQUENCE DISPLAY
  // ==========================================================================
  
  const showSequence = useCallback((seq: Color[]) => {
    setIsShowingSequence(true);
    setIsInputPhase(false);
    backgroundMusicService.duck();
    
    sequenceNotesRef.current = seq.map((_, i) => 
      melodyService.getColorFrequency(seq[i], i)
    );

    const startDelay = 300;
    const showMs = 500;
    const gapMs = 200;
    
    seq.forEach((color, index) => {
      const delay = startDelay + index * (showMs + gapMs);
      
      setTimeout(() => {
        const freq = sequenceNotesRef.current[index] || NOTE_FREQUENCIES['A4'];
        soundService.playNote(freq, showMs / 1000);
        hapticService.vibrateColor(color);
      }, delay);
    });
    
    const totalMs = startDelay + seq.length * showMs + Math.max(0, seq.length - 1) * gapMs + 100;

    setTimeout(() => {
      setIsShowingSequence(false);
      setIsInputPhase(true);
      resetTimer();
      backgroundMusicService.unduck();
    }, totalMs);
  }, [resetTimer]);

  // ==========================================================================
  // PLAYER INPUT
  // ==========================================================================
  
  const handleColorClick = useCallback(
    (color: Color) => {
      if (!isInputPhase || isShowingSequence || gameOver) return;
      if (playerSequence.length >= sequence.length) return;

      const nextIndex = playerSequence.length;
      const expectedColor = sequence[nextIndex];
      
      const freq = sequenceNotesRef.current[nextIndex] || NOTE_FREQUENCIES['A4'];
      soundService.playNote(freq, 0.2);
      hapticService.vibrateColor(color);
      
      if (color !== expectedColor) {
        hapticService.vibrateError();
        soundService.playError();
        loseLife();
        return;
      }
      
      const tapPoints = scoringService.scoreTap();
      setScore((prev) => prev + tapPoints);
      
      const next = [...playerSequence, color];
      setPlayerSequence(next);

      if (next.length === sequence.length) {
        setIsInputPhase(false);
        
        const roundScore = scoringService.scoreRoundComplete(
          round,
          sequence.length,
          timeRemaining,
          false
        );
        
        setScore((prev) => prev + roundScore.roundBonus + roundScore.speedBonus);
        
        hapticService.vibrateRoundComplete();
        soundService.playSuccess();
        
        const nextRound = round + 1;
        if (nextRound % LIFE_REGEN_INTERVAL === 0 && lives < MAX_LIVES) {
          gainLife();
        }
        
        backgroundMusicService.setIntensityForRound(nextRound);
        
        const nextSeq = [...sequence, getNextColor()];
        setRound(nextRound);
        setSequence(nextSeq);

        setTimeout(() => {
          setPlayerSequence([]);
          showSequence(nextSeq);
        }, 500);
      }
    },
    [gameOver, isInputPhase, isShowingSequence, playerSequence, sequence, round, timeRemaining, lives, loseLife, gainLife, getNextColor, showSequence]
  );

  // ==========================================================================
  // GAME CONTROLS
  // ==========================================================================
  
  const handleStartGame = useCallback(() => {
    scoringService.reset();
    melodyService.reset();
    isNewHighScoreRef.current = false;
    
    setGameStarted(true);
    setGameOver(false);
    setShowGameOver(false);
    setShowHighScoreCelebration(false);
    setRound(1);
    setLives(STARTING_LIVES);
    setScore(0);
    
    const firstSeq = [getNextColor()];
    setSequence(firstSeq);
    setPlayerSequence([]);
    
    backgroundMusicService.setIntensityForRound(1);
    backgroundMusicService.start();
    
    showSequence(firstSeq);
  }, [getNextColor, showSequence]);
  
  const handlePlayAgain = useCallback(() => {
    setShowGameOver(false);
    setShowHighScoreCelebration(false);
    handleStartGame();
  }, [handleStartGame]);
  
  const handleExit = useCallback(() => {
    backgroundMusicService.stop();
    
    if (isNewHighScoreRef.current && gameOver) {
      setShowGameOver(false);
      setShowHighScoreCelebration(true);
    } else {
      navigate('/home');
    }
  }, [navigate, gameOver]);
  
  const handleExitClick = useCallback(() => {
    if (gameStarted && !gameOver) {
      setShowExitConfirm(true);
    } else {
      handleExit();
    }
  }, [gameStarted, gameOver, handleExit]);
  
  const handleToggleSound = useCallback(() => {
    const newMuted = soundService.toggleMute();
    backgroundMusicService.toggleMute();
    setIsMuted(newMuted);
    hapticService.vibrateToggle();
  }, []);
  
  const handleHighScoreContinue = useCallback(() => {
    setShowHighScoreCelebration(false);
    navigate('/home');
  }, [navigate]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <AppShell variant="jelly">
      {/* ===== COMPACT HEADER ===== */}
      <header className="flex items-center justify-between gap-1 py-1">
        {/* Left: Best Score */}
        <AnimatedScore 
          score={highScore} 
          label="Best" 
          size="sm" 
          theme="muted" 
        />

        {/* Center: Lives */}
        <GlassSurface className="px-2.5 py-1.5 rounded-xl">
          <HeartDisplay 
            lives={lives} 
            maxLives={MAX_LIVES}
            animatingIndex={heartAnimationIndex}
            animationType={heartAnimationType}
          />
        </GlassSurface>

        {/* Right: Current Score */}
        <AnimatedScore 
          score={score} 
          label="Score" 
          size="md" 
          theme="gold" 
        />
      </header>

      {/* Timer Bar - Compact */}
      {gameStarted && !gameOver && isInputPhase && (
        <div className="mt-1">
          <TimerBar 
            timeRemaining={timeRemaining} 
            totalTime={TIME_LIMIT}
            showNumber={true}
          />
        </div>
      )}

      {/* ===== GAME AREA - Fills remaining space ===== */}
      <main className="flex-1 flex flex-col items-center justify-center min-h-0">
        {!gameStarted ? (
          // Ready Modal - Compact
          <div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{
              paddingLeft: 'max(12px, env(safe-area-inset-left))',
              paddingRight: 'max(12px, env(safe-area-inset-right))',
              paddingTop: 'max(12px, env(safe-area-inset-top))',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <GlassSurface className="relative z-10 p-5 text-center max-w-xs w-full">
              <h2 className="text-xl font-bold text-white mb-2">Ready?</h2>
              <p className="text-white/60 text-sm mb-4">
                Watch the pattern, then repeat it.
              </p>
              <button
                onClick={handleStartGame}
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
                Start Game
              </button>
            </GlassSurface>
          </div>
        ) : null}
        
        {/* Simon Board */}
        <JellySimonBoard
          sequence={sequence}
          isShowingSequence={isShowingSequence}
          isInputPhase={isInputPhase}
          playerSequence={playerSequence}
          onColorClick={handleColorClick}
          round={round}
          disabled={!gameStarted || gameOver}
        />
      </main>

      {/* ===== COMPACT FOOTER ===== */}
      <footer className="flex items-center justify-between py-1">
        {/* Left: Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className="
            p-2.5 rounded-xl
            bg-white/5 hover:bg-white/10
            border border-white/10
            text-white/70 hover:text-white
            transition-all duration-200
            active:scale-95
          "
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <SoundOffIcon size={18} /> : <SoundOnIcon size={18} />}
        </button>

        {/* Center: Status */}
        {gameStarted && !gameOver && (
          <GlassSurface className="px-3 py-1.5 rounded-xl">
            {isShowingSequence ? (
              <span className="text-yellow-300 font-medium text-xs animate-pulse">
                👀 Watch!
              </span>
            ) : isInputPhase ? (
              <span className="text-cyan-300 font-medium text-xs">
                🎯 {playerSequence.length}/{sequence.length}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">...</span>
            )}
          </GlassSurface>
        )}

        {/* Right: Exit Button */}
        <button
          onClick={handleExitClick}
          className="
            p-2.5 rounded-xl
            bg-white/5 hover:bg-white/10
            border border-white/10
            text-white/70 hover:text-white
            transition-all duration-200
            active:scale-95
          "
          aria-label="Exit"
        >
          <ExitIcon size={18} />
        </button>
      </footer>

      {/* ===== MODALS ===== */}
      
      <ConfirmModal
        isOpen={showExitConfirm}
        title="Give up?"
        message="You'll lose your current progress if you exit now."
        confirmText="Exit"
        cancelText="Keep Playing"
        onConfirm={handleExit}
        onCancel={() => setShowExitConfirm(false)}
        danger
      />
      
      <GameOverModal
        isOpen={showGameOver}
        score={score}
        round={round}
        isNewHighScore={isNewHighScoreRef.current}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
      />
      
      <NewHighScoreModal
        isOpen={showHighScoreCelebration}
        score={score}
        previousHighScore={previousHighScoreRef.current}
        onContinue={handleHighScoreContinue}
      />
    </AppShell>
  );
};

export default GamePage;
