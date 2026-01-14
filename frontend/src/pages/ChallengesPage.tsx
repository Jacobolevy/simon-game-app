/**
 * Challenges Page - Mobile App Style
 *
 * - Lobby list (community pool)
 * - Sticky bottom CTA: Create Challenge
 * - Friend deep link: /challenges?challenge=<id> opens Ready overlay
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';
import { TimerBar } from '../components/ui/TimerBar';
import { JellySimonBoard } from '../components/ui/glass';
import { Toast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ProTipRotator } from '../components/ui/ProTipRotator';
import { RulesInfoModal } from '../components/ui/RulesInfoModal';
import { soundService } from '../services/soundService';
import { hapticService } from '../services/hapticService';
import type { Color } from '../shared/types';
import { generateChallengeSequence } from '../utils/deterministicSequence';
import { CHALLENGE_CONSTANTS, calculateMultiplier, calculatePenalty, calculateSpeedPoints } from '../gameLogic/challengeLogic';
import {
  createChallenge,
  getChallenge,
  listCommunityChallenges,
  submitChallengeAttempt,
  type ChallengeDetail,
  type ChallengeSummary,
} from '../services/challengeService';
import { useUserProgressStore } from '../store/userProgressStore';

type View = 'lobby' | 'ready' | 'playing' | 'result';

type RunMode = 'create' | 'beat';

type RunState = {
  mode: RunMode;
  challenge: ChallengeDetail | null;
  seed: string;
  targetScore: number;
  timeLimitSeconds: number;
  endsAt: number;
  secondsRemaining: number;

  sequenceIndex: number;
  sequenceLength: number;
  currentSequence: Color[];
  isShowingSequence: boolean;
  isInputPhase: boolean;
  playerSequence: Color[];

  sequencesCompleted: number;
  maxMultiplier: number;
  score: number;
  lastEarned: { earned: number; speedPoints: number; multiplier: number } | null;
  lastPenalty: { penalty: number; at: number } | null;
  inputStartAt: number;
};

function nowSecLeft(endsAt: number) {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function ChallengesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const user = useUserProgressStore((s) => s.user);
  const setPendingAward = useUserProgressStore((s) => s.setPendingAward);

  const [view, setView] = useState<View>('lobby');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [community, setCommunity] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeChallenge, setActiveChallenge] = useState<ChallengeDetail | null>(null);
  const [run, setRun] = useState<RunState | null>(null);

  const timerRef = useRef<number | null>(null);

  const challengeIdFromLink = searchParams.get('challenge');

  const refreshCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listCommunityChallenges();
      setCommunity(items);
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + deep link handling
  useEffect(() => {
    refreshCommunity();
  }, [refreshCommunity]);

  useEffect(() => {
    if (!challengeIdFromLink) return;
    (async () => {
      try {
        const ch = await getChallenge(challengeIdFromLink);
        setActiveChallenge(ch);
        setView('ready');
      } catch (e) {
        setToast({ message: (e as Error).message, type: 'error' });
      }
    })();
  }, [challengeIdFromLink]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((endsAt: number) => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setRun((prev) => {
        if (!prev) return prev;
        const secondsRemaining = nowSecLeft(endsAt);
        if (secondsRemaining <= 0) {
          stopTimer();
          return { ...prev, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining };
      });
    }, 250);
  }, [stopTimer]);

  const beginRun = useCallback(async (mode: RunMode, challenge: ChallengeDetail | null) => {
    await soundService.init();

    const seed = challenge?.seed || `local:${Date.now()}`;
    const timeLimitSeconds = challenge?.rules?.timeLimitSeconds || CHALLENGE_CONSTANTS.TIME_LIMIT_SECONDS;
    const endsAt = Date.now() + timeLimitSeconds * 1000;

    const sequenceLength = challenge?.rules?.initialSequenceLength || CHALLENGE_CONSTANTS.INITIAL_SEQUENCE_LENGTH;
    const sequenceIndex = 0;
    const currentSequence = generateChallengeSequence(seed, sequenceIndex, sequenceLength);

    const initial: RunState = {
      mode,
      challenge,
      seed,
      targetScore: challenge?.creatorScore || 0,
      timeLimitSeconds,
      endsAt,
      secondsRemaining: timeLimitSeconds,

      sequenceIndex,
      sequenceLength,
      currentSequence,
      isShowingSequence: true,
      isInputPhase: false,
      playerSequence: [],

      sequencesCompleted: 0,
      maxMultiplier: 1,
      score: 0,
      lastEarned: null,
      lastPenalty: null,
      inputStartAt: Date.now(),
    };

    setRun(initial);
    setView('playing');

    startTimer(endsAt);

    // Show sequence for ~len based timing (simple)
    const showMs = Math.min(2200, 800 + sequenceLength * 220);
    window.setTimeout(() => {
      setRun((prev) => prev ? ({ ...prev, isShowingSequence: false, isInputPhase: true, inputStartAt: Date.now() }) : prev);
    }, showMs);
  }, [startTimer]);

  const handleStartCreate = useCallback(() => {
    setActiveChallenge(null);
    beginRun('create', null);
  }, [beginRun]);

  const handleBeatIt = useCallback(async (id: string) => {
    try {
      const ch = await getChallenge(id);
      setActiveChallenge(ch);
      setView('ready');
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  }, []);

  const readyTitle = useMemo(() => {
    if (!activeChallenge) return 'Ready?';
    return `Ready for the challenge?`;
  }, [activeChallenge]);

  const readySubtitle = useMemo(() => {
    if (!activeChallenge) return '';
    return `${activeChallenge.creatorName} made ${activeChallenge.creatorScore} points. Can you beat them?`;
  }, [activeChallenge]);

  const onColorClick = useCallback((color: Color) => {
    setRun((prev) => {
      if (!prev) return prev;
      if (prev.isShowingSequence || !prev.isInputPhase) return prev;
      if (prev.secondsRemaining <= 0) return prev;

      hapticService.vibrateColor(color);
      const nextIndex = prev.playerSequence.length;
      const expected = prev.currentSequence[nextIndex];

      // Wrong input => penalty, restart same sequence (no progress)
      if (color !== expected) {
        const penalty = calculatePenalty(prev.sequenceLength);
        soundService.playError();
        return {
          ...prev,
          score: Math.max(0, prev.score - penalty),
          playerSequence: [],
          lastPenalty: { penalty, at: Date.now() },
          lastEarned: null,
          isInputPhase: true,
          inputStartAt: Date.now(),
        };
      }

      // Correct tap
      const newSeq = [...prev.playerSequence, color];
      soundService.playColorClick(color);

      // Sequence complete => score + next sequence
      if (newSeq.length === prev.currentSequence.length) {
        const durationMs = Math.max(1, Date.now() - prev.inputStartAt);
        const speedPoints = calculateSpeedPoints(durationMs, prev.sequenceLength);
        const multiplier = calculateMultiplier(prev.sequencesCompleted);
        const earned = speedPoints * multiplier;

        const sequencesCompleted = prev.sequencesCompleted + 1;
        const nextMultiplier = calculateMultiplier(sequencesCompleted);

        const nextLength = prev.sequenceLength + (activeChallenge?.rules?.sequenceIncrement || CHALLENGE_CONSTANTS.SEQUENCE_INCREMENT);
        const nextIndex = prev.sequenceIndex + 1;
        const nextSequence = generateChallengeSequence(prev.seed, nextIndex, nextLength);

        soundService.playSuccess();

        // Briefly show sequence again
        window.setTimeout(() => {
          setRun((p) => p ? ({ ...p, isShowingSequence: false, isInputPhase: true, inputStartAt: Date.now() }) : p);
        }, Math.min(2300, 820 + nextLength * 210));

        return {
          ...prev,
          score: prev.score + earned,
          lastEarned: { earned, speedPoints, multiplier },
          maxMultiplier: Math.max(prev.maxMultiplier, nextMultiplier),
          sequencesCompleted,
          sequenceIndex: nextIndex,
          sequenceLength: nextLength,
          currentSequence: nextSequence,
          playerSequence: [],
          isShowingSequence: true,
          isInputPhase: false,
          inputStartAt: Date.now(),
        };
      }

      return { ...prev, playerSequence: newSeq };
    });
  }, [activeChallenge]);

  // Finish run when timer hits 0
  useEffect(() => {
    if (!run) return;
    if (run.secondsRemaining > 0) return;
    stopTimer();
    setView('result');
  }, [run, stopTimer]);

  const handleConfirmExit = useCallback(() => {
    stopTimer();
    setRun(null);
    setView('lobby');
    setShowExitConfirm(false);
    navigate('/home');
  }, [navigate, stopTimer]);

  const publishChallenge = useCallback(async (visibility: { friend: boolean; community: boolean }) => {
    if (!run) return;
    try {
      const detail = await createChallenge({
        creatorName: user.name,
        creatorScore: run.score,
        visibility,
        seed: run.seed,
        rules: {
          timeLimitSeconds: CHALLENGE_CONSTANTS.TIME_LIMIT_SECONDS,
          initialSequenceLength: CHALLENGE_CONSTANTS.INITIAL_SEQUENCE_LENGTH,
          sequenceIncrement: CHALLENGE_CONSTANTS.SEQUENCE_INCREMENT,
          penaltyPerStep: CHALLENGE_CONSTANTS.PENALTY_PER_STEP,
          maxPenalty: CHALLENGE_CONSTANTS.MAX_PENALTY,
          scoringVersion: CHALLENGE_CONSTANTS.SCORING_VERSION,
        },
      });

      if (visibility.community) {
        refreshCommunity();
      }

      // Share if friend
      if (visibility.friend) {
        const shareUrl = `${window.location.origin}/?challenge=${detail.id}`;
        const shareText = `🔥 Simon Challenge: I made ${run.score} points in 60s. Can you beat me?`;
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Simon Challenge', text: shareText, url: shareUrl });
            setToast({ message: 'Shared!', type: 'success' });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
              setToast({ message: 'Link copied!', type: 'success' });
            }
          }
        } else {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          setToast({ message: 'Link copied!', type: 'success' });
        }
      } else {
        setToast({ message: 'Published!', type: 'success' });
      }
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  }, [refreshCommunity, run, user.name]);

  const submitBeatResult = useCallback(async () => {
    if (!activeChallenge || !run) return;
    try {
      const result = await submitChallengeAttempt(activeChallenge.id, { playerName: user.name, score: run.score });
      setPendingAward({
        xpDelta: result.xpAwarded,
        reason: result.didBeatCreator ? 'challenge_beat' : 'challenge_try',
        createdAt: Date.now(),
      });
      setToast({ message: result.didBeatCreator ? `✅ Beat it! +${result.xpAwarded} XP` : `+${result.xpAwarded} XP`, type: 'success' });
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  }, [activeChallenge, run, setPendingAward, user.name]);

  // Lobby view
  if (view === 'lobby') {
    return (
      <AppShell variant="jelly">
        <div className="h-full flex flex-col overflow-hidden">
          <header className="flex items-center justify-between mb-2">
            <div>
              <div className="text-white font-bold text-lg leading-none">Challenges</div>
              <div className="text-white/55 text-[11px]">Beat community runs. Create your own.</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              ← Home
            </button>
          </header>

          <GlassSurface className="p-3 mb-2">
            <ProTipRotator
              tips={[
                'Friend challenges use the same sequences (seeded). It’s a real duel.',
                'Wrong tap doesn’t end your run — but it costs points.',
                'Beat challenges to earn XP.',
              ]}
            />
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="mt-2 w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              ℹ️ How Challenges work
            </button>
          </GlassSurface>

          <GlassSurface className="p-3 flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/70 text-xs font-semibold">Community pool</div>
              <button
                type="button"
                onClick={refreshCommunity}
                className="text-white/60 hover:text-white text-xs"
              >
                Refresh
              </button>
            </div>

            <div className="h-full overflow-hidden">
              <div className="h-full overflow-auto pr-1">
                {loading && <div className="text-white/50 text-xs">Loading…</div>}
                {!loading && community.length === 0 && (
                  <div className="text-white/50 text-xs">No challenges yet. Create the first!</div>
                )}

                <div className="space-y-2">
                  {community.map((c) => (
                    <div
                      key={c.id}
                      className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <div className="text-white text-sm font-semibold leading-tight">{c.creatorName}</div>
                        <div className="text-white/55 text-[11px]">{c.creatorScore} pts</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBeatIt(c.id)}
                        className="h-10 px-3 rounded-xl bg-white text-slate-900 text-xs font-black active:scale-[0.98] transition-all"
                        style={{ touchAction: 'manipulation' }}
                      >
                        Beat it
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassSurface>

          {/* Sticky bottom CTA */}
          <div
            className="pt-2"
            style={{
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              + Create Challenge (60s)
            </button>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <RulesInfoModal isOpen={showRules} variant="solo" onClose={() => setShowRules(false)} />
      </AppShell>
    );
  }

  // Ready overlay (friend + community)
  if (view === 'ready') {
    return (
      <AppShell variant="jelly" className="justify-center">
        <GlassSurface className="p-4 w-full">
          <div className="text-center">
            <div className="text-white text-lg font-black">{readyTitle}</div>
            <div className="text-white/60 text-xs mt-1">{readySubtitle}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => beginRun('beat', activeChallenge)}
                className="h-12 rounded-2xl bg-white text-slate-900 font-black text-sm active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                START
              </button>
              <button
                type="button"
                onClick={() => { setActiveChallenge(null); setView('lobby'); navigate('/challenges', { replace: true }); }}
                className="h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 font-semibold text-sm active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                Back
              </button>
            </div>
          </div>
        </GlassSurface>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AppShell>
    );
  }

  // Playing view
  if (view === 'playing' && run) {
    const penaltyVisible = run.lastPenalty && Date.now() - run.lastPenalty.at < 900;
    const earnedVisible = run.lastEarned && Date.now() - (run.lastPenalty?.at || 0) > 120;
    const multiplier = calculateMultiplier(run.sequencesCompleted);

    return (
      <AppShell variant="jelly">
        <header className="mb-2">
          <GlassSurface className="p-2 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-white/70 text-xs font-semibold">Challenge (60s)</div>
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                Exit
              </button>
            </div>
            <div className="mt-2">
              <TimerBar timeRemaining={run.secondsRemaining} totalTime={run.timeLimitSeconds} showNumber={true} />
            </div>
          </GlassSurface>
        </header>

        <GlassSurface className="p-3 mb-2">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm font-black tabular-nums">{run.score} pts</div>
            <div className="text-white/60 text-xs font-semibold">x{multiplier}</div>
          </div>
          <div className="text-white/50 text-[10px] mt-1">
            len {run.sequenceLength} • done {run.sequencesCompleted}
          </div>
        </GlassSurface>

        {/* Penalty / Earned micro-feedback */}
        <div className="h-6 mb-1 flex items-center justify-center">
          {penaltyVisible && run.lastPenalty && (
            <span className="text-red-300 text-xs font-black animate-in fade-in zoom-in-90 duration-150">
              -{run.lastPenalty.penalty}
            </span>
          )}
          {!penaltyVisible && earnedVisible && run.lastEarned && (
            <span className="text-green-300 text-xs font-black animate-in fade-in zoom-in-90 duration-150">
              +{run.lastEarned.earned}
            </span>
          )}
        </div>

        <main className="flex-1 flex flex-col items-center justify-center min-h-0">
          <JellySimonBoard
            sequence={run.currentSequence}
            isShowingSequence={run.isShowingSequence}
            isInputPhase={run.isInputPhase}
            playerSequence={run.playerSequence}
            onColorClick={onColorClick}
            disabled={false}
            round={Math.max(1, run.currentSequence.length)}
          />
          <div className="mt-2 text-center">
            <p className="text-white/70 text-xs">
              {run.isShowingSequence ? '👀 Watch' : '🎯 Repeat'}
            </p>
          </div>
        </main>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <ConfirmModal
          isOpen={showExitConfirm}
          title="Leave Challenge?"
          message="Your run will end."
          confirmText="Leave"
          cancelText="Stay"
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
          danger
        />
      </AppShell>
    );
  }

  // Result view
  if (view === 'result' && run) {
    const canBeat = activeChallenge && run.score > (activeChallenge.creatorScore || 0);
    return (
      <AppShell variant="jelly" className="justify-center">
        <GlassSurface className="p-4 w-full">
          <div className="text-center">
            <div className="text-white text-xl font-black">Score</div>
            <div className="text-red-400 font-mono font-black text-4xl tracking-widest tabular-nums mt-2">
              {String(run.score).padStart(4, '0')}
            </div>
            {activeChallenge && (
              <div className="text-white/60 text-xs mt-2">
                Target: {activeChallenge.creatorName} — {activeChallenge.creatorScore} pts
              </div>
            )}

            {activeChallenge && (
              <button
                type="button"
                onClick={submitBeatResult}
                className={[
                  'mt-4 w-full h-12 rounded-2xl font-black text-sm active:scale-[0.98] transition-all',
                  canBeat ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white/10 text-white/70 border border-white/10',
                ].join(' ')}
                style={{ touchAction: 'manipulation' }}
              >
                {canBeat ? '✅ Beat it! (claim XP)' : 'Submit result (XP)'}
              </button>
            )}

            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => publishChallenge({ friend: true, community: false })}
                className="w-full h-12 rounded-2xl bg-white text-slate-900 font-black text-sm active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                Challenge a friend
              </button>
              <button
                type="button"
                onClick={() => publishChallenge({ friend: false, community: true })}
                className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                Challenge community
              </button>
              <button
                type="button"
                onClick={() => { setRun(null); setActiveChallenge(null); setView('lobby'); navigate('/challenges', { replace: true }); refreshCommunity(); }}
                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold active:scale-[0.98] transition-all"
                style={{ touchAction: 'manipulation' }}
              >
                Back to lobby
              </button>
            </div>
          </div>
        </GlassSurface>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AppShell>
    );
  }

  return null;
}

export default ChallengesPage;

