/**
 * Game Page - Simon 2026
 * 
 * Main gameplay screen with the Simon board.
 * All text in English.
 */

import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import type { Color } from '../shared/types';
import { JellySimonBoard } from '../components/ui/glass';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';

const COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];
const randomColor = (): Color => COLORS[Math.floor(Math.random() * COLORS.length)];

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [isInputPhase, setIsInputPhase] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const handleBack = () => {
    navigate('/home');
  };

  const showSequence = useCallback((seq: Color[]) => {
    setIsShowingSequence(true);
    setIsInputPhase(false);

    // JellySimonBoard timing: start delay ~300ms, show 500ms each, 200ms gaps between items
    const startDelay = 300;
    const showMs = 500;
    const gapMs = 200;
    const totalMs = startDelay + seq.length * showMs + Math.max(0, seq.length - 1) * gapMs + 50;

    window.setTimeout(() => {
      setIsShowingSequence(false);
      setIsInputPhase(true);
    }, totalMs);
  }, []);

  const handleColorClick = useCallback(
    (color: Color) => {
      if (!isInputPhase || isShowingSequence || gameOver) return;
      if (playerSequence.length >= sequence.length) return;

      const next = [...playerSequence, color];
      setPlayerSequence(next);

      // If sequence complete, validate immediately (no submit)
      if (next.length === sequence.length) {
        setIsInputPhase(false);
        const isCorrect = next.every((c, i) => c === sequence[i]);

        if (!isCorrect) {
          setGameOver(true);
          return;
        }

        const nextSeq = [...sequence, randomColor()];
        setRound((r) => r + 1);
        setSequence(nextSeq);

        // Reset input and play next sequence
        window.setTimeout(() => {
          setPlayerSequence([]);
          showSequence(nextSeq);
        }, 350);
      }
    },
    [gameOver, isInputPhase, isShowingSequence, playerSequence, sequence, showSequence]
  );

  const handleStartGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setRound(1);
    const firstSeq = [randomColor()];
    setSequence(firstSeq);
    setPlayerSequence([]);
    showSequence(firstSeq);
  };

  return (
    <AppShell variant="jelly" className="flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="
            flex items-center gap-2
            bg-white/5
            backdrop-blur-md
            border border-white/10
            rounded-xl
            px-4 py-2
            text-white/80 text-sm
            hover:bg-white/10
            transition-all
          "
        >
          <span>←</span>
          <span>Exit</span>
        </button>

        <GlassSurface className="px-4 py-2 rounded-2xl">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Round</span>
          <span className="ml-2 text-white font-bold text-lg">{round}</span>
        </GlassSurface>

        <GlassSurface className="px-4 py-2 rounded-2xl">
          <span className="text-2xl">❤️</span>
          <span className="ml-1 text-white font-bold">3</span>
        </GlassSurface>
      </header>

      {/* MAIN GAME AREA */}
      <main className="flex-1 flex flex-col items-center justify-center px-2">
        {!gameStarted ? (
          <GlassSurface className="p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ready?</h2>
            <p className="text-white/55 mb-6 text-sm">Watch the pattern, then repeat it.</p>
            <button
              onClick={handleStartGame}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-[0.99]"
            >
              🎮 Start Game
            </button>
          </GlassSurface>
        ) : gameOver ? (
          <GlassSurface className="p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
            <p className="text-white/55 mb-6 text-sm">You reached round {round}.</p>
            <button
              onClick={handleStartGame}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-[0.99]"
            >
              🔄 Play Again
            </button>
          </GlassSurface>
        ) : (
          <JellySimonBoard
            sequence={sequence}
            isShowingSequence={isShowingSequence}
            isInputPhase={isInputPhase}
            playerSequence={playerSequence}
            onColorClick={handleColorClick}
            round={round}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="pb-2 text-center">
        {gameStarted && (
          <GlassSurface className="inline-block px-5 py-2 rounded-2xl">
            {isShowingSequence ? (
              <span className="text-yellow-300 font-medium animate-pulse">
                👀 Watch the sequence!
              </span>
            ) : isInputPhase ? (
              <span className="text-cyan-300 font-medium">
                🎯 Your turn: {playerSequence.length}/{sequence.length}
              </span>
            ) : (
              <span className="text-gray-400">Loading...</span>
            )}
          </GlassSurface>
        )}
      </footer>
    </AppShell>
  );
};

export default GamePage;
