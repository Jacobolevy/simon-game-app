/**
 * Game Page - Simon 2026
 * 
 * Main gameplay screen with full feature set:
 * - 3-Zone Layout (Status Panel, Game Area, Control Bar)
 * - Hybrid Scoring System
 * - Lives with regeneration every 10 rounds
 * - Timer with visual feedback
 * - Melody-based sequences
 * - Haptic feedback
 * - High score celebration
 * - All text in English
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
const LIFE_REGEN_INTERVAL = 10; // Regenerate 1 life every 10 rounds
const TIME_LIMIT = 30; // seconds per turn

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
    // Initialize audio services on mount
    soundService.init();
    backgroundMusicService.init();
    
    return () => {
      backgroundMusicService.stop();
    };
  }, []);
  
  // Update high score reference when it changes
  useEffect(() => {
    previousHighScoreRef.current = highScore;
  }, [highScore]);

  // ==========================================================================
  // LIFE MANAGEMENT
  // ==========================================================================
  
  const loseLife = useCallback(() => {
    setLives((prev) => {
      const newLives = prev - 1;
      
      // Animate the heart that's being lost
      setHeartAnimationIndex(newLives);
      setHeartAnimationType('lost');
      setTimeout(() => setHeartAnimationType('none'), 500);
      
      if (newLives <= 0) {
        // Game over
        setGameOver(true);
        setIsInputPhase(false);
        backgroundMusicService.stop();
        hapticService.vibrateGameOver();
        soundService.playEliminated();
        
        // Check for high score
        if (score > highScore) {
          isNewHighScoreRef.current = true;
          updateHighScore(score);
        }
        
        setTimeout(() => setShowGameOver(true), 500);
      } else {
        // Lost a life but still alive
        hapticService.vibrateLifeLost();
        
        // Continue to next round after brief pause
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
      
      // Animate the heart being gained
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
    
    // Store frequencies for this sequence
    sequenceNotesRef.current = seq.map((_, i) => 
      melodyService.getColorFrequency(seq[i], i)
    );

    // Calculate timing
    const startDelay = 300;
    const showMs = 500;
    const gapMs = 200;
    
    // Play sounds for each color in sequence
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
      
      // Play sound and haptics for the pressed color
      const freq = sequenceNotesRef.current[nextIndex] || NOTE_FREQUENCIES['A4'];
      soundService.playNote(freq, 0.2);
      hapticService.vibrateColor(color);
      
      // Check if correct immediately
      if (color !== expectedColor) {
        // Wrong! Immediate feedback and lose life
        hapticService.vibrateError();
        soundService.playError();
        loseLife();
        return;
      }
      
      // Correct tap - add points
      const tapPoints = scoringService.scoreTap();
      setScore((prev) => prev + tapPoints);
      
      const next = [...playerSequence, color];
      setPlayerSequence(next);

      // Check if sequence complete
      if (next.length === sequence.length) {
        setIsInputPhase(false);
        
        // Calculate round score
        const roundScore = scoringService.scoreRoundComplete(
          round,
          sequence.length,
          timeRemaining,
          false // no mistakes if we got here
        );
        
        setScore((prev) => prev + roundScore.roundBonus + roundScore.speedBonus);
        
        // Success feedback
        hapticService.vibrateRoundComplete();
        soundService.playSuccess();
        
        // Check for life regeneration
        const nextRound = round + 1;
        if (nextRound % LIFE_REGEN_INTERVAL === 0 && lives < MAX_LIVES) {
          gainLife();
        }
        
        // Update music intensity
        backgroundMusicService.setIntensityForRound(nextRound);
        
        // Prepare next round
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
    // Reset everything
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
    
    // Start background music
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
    navigate('/home');
  }, [navigate]);
  
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
  
  const handleHighScoreCelebration = useCallback(() => {
    setShowGameOver(false);
    setShowHighScoreCelebration(true);
  }, []);
  
  const handleHighScoreContinue = useCallback(() => {
    setShowHighScoreCelebration(false);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <AppShell variant="jelly" className="flex flex-col">
      {/* ===== STATUS PANEL (Header) ===== */}
      <header className="flex items-center justify-between gap-2 px-1">
        {/* Left: Best Score */}
        <AnimatedScore 
          score={highScore} 
          label="Best" 
          size="sm" 
          theme="muted" 
        />

        {/* Center: Lives */}
        <GlassSurface className="px-3 py-2 rounded-2xl">
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

      {/* Timer Bar - Only during input phase */}
      {gameStarted && !gameOver && isInputPhase && (
        <div className="px-4 mt-2">
          <TimerBar 
            timeRemaining={timeRemaining} 
            totalTime={TIME_LIMIT}
            showNumber={true}
          />
        </div>
      )}

      {/* ===== GAME AREA (Center) ===== */}
      <main className="flex-1 flex flex-col items-center justify-center px-2">
        {!gameStarted ? (
          // Ready Modal
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <GlassSurface className="relative z-10 p-8 text-center max-w-sm w-full animate-spring">
              <h2 className="text-3xl font-bold text-white mb-3">Ready?</h2>
              <p className="text-white/60 mb-6">
                Watch the pattern, then repeat it.
              </p>
              <button
                onClick={handleStartGame}
                className="
                  w-full py-4 px-6
                  bg-gradient-to-r from-green-500 to-emerald-600
                  hover:from-green-400 hover:to-emerald-500
                  rounded-2xl font-bold text-lg text-white
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
        
        {/* Simon Board - Always visible behind modals */}
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

      {/* ===== CONTROL BAR (Footer) ===== */}
      <footer className="flex items-center justify-between px-4 pb-2">
        {/* Left: Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className="
            p-3 rounded-xl
            bg-white/5 hover:bg-white/10
            border border-white/10
            text-white/70 hover:text-white
            transition-all duration-200
            active:scale-95
          "
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <SoundOffIcon size={20} /> : <SoundOnIcon size={20} />}
        </button>

        {/* Center: Status */}
        {gameStarted && !gameOver && (
          <GlassSurface className="px-4 py-2 rounded-2xl">
            {isShowingSequence ? (
              <span className="text-yellow-300 font-medium text-sm animate-pulse">
                👀 Watch!
              </span>
            ) : isInputPhase ? (
              <span className="text-cyan-300 font-medium text-sm">
                🎯 {playerSequence.length}/{sequence.length}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">...</span>
            )}
          </GlassSurface>
        )}

        {/* Right: Exit Button */}
        <button
          onClick={handleExitClick}
          className="
            p-3 rounded-xl
            bg-white/5 hover:bg-white/10
            border border-white/10
            text-white/70 hover:text-white
            transition-all duration-200
            active:scale-95
          "
          aria-label="Exit"
        >
          <ExitIcon size={20} />
        </button>
      </footer>

      {/* ===== MODALS ===== */}
      
      {/* Exit Confirmation */}
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
      
      {/* Game Over */}
      <GameOverModal
        isOpen={showGameOver}
        score={score}
        round={round}
        isNewHighScore={isNewHighScoreRef.current}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
        onHighScoreCelebration={handleHighScoreCelebration}
      />
      
      {/* New High Score Celebration */}
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
