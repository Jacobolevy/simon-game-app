import { GlassSurface } from '../ui/layout/GlassSurface';
import type { DashboardUserSummary } from './types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserProgressStore } from '../../store/userProgressStore';

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

/**
 * UserProgressBadge - Compact Mobile Version
 */
export function UserProgressBadge({ user }: { user: DashboardUserSummary }) {
  const { consumePendingAward, applyAwardInstant } = useUserProgressStore();

  // Animated display state (so we can do the “bar fills + level up rollover” sequence)
  const [displayLevel, setDisplayLevel] = useState(user.level);
  const [displayLevelName, setDisplayLevelName] = useState(user.levelName);
  const [displayCurrentXP, setDisplayCurrentXP] = useState(user.currentXP);
  const [displayNextXP, setDisplayNextXP] = useState(user.nextLevelXP);
  const [xpPop, setXpPop] = useState(false);

  const animRef = useRef<number | null>(null);

  // Keep display in sync if user changes (non-animated baseline)
  useEffect(() => {
    setDisplayLevel(user.level);
    setDisplayLevelName(user.levelName);
    setDisplayCurrentXP(user.currentXP);
    setDisplayNextXP(user.nextLevelXP);
  }, [user.currentXP, user.level, user.levelName, user.nextLevelXP]);

  useEffect(() => {
    const award = consumePendingAward();
    if (!award || award.xpDelta <= 0) return;

    // Animate then commit state in store at end (so source-of-truth matches UI)
    const start = performance.now();
    const total = Math.min(2000, 700 + Math.min(1300, award.xpDelta * 6)); // ~0.7s -> 2.0s

    const from = { level: user.level, name: user.levelName, cur: user.currentXP, next: user.nextLevelXP };

    // Simulate leveling locally during animation (matches store logic)
    const computeNextLevelXP = (level: number) => Math.round(250 * Math.pow(1.35, level - 1));
    const levelName = (level: number) => {
      if (level < 3) return 'Rookie';
      if (level < 6) return 'Cadet';
      if (level < 10) return 'Pro';
      if (level < 15) return 'Elite';
      return 'Legend';
    };

    const targetAward = Math.floor(award.xpDelta);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      let remaining = Math.floor(targetAward * eased);

      let level = from.level;
      let cur = from.cur;
      let next = from.next || computeNextLevelXP(level);

      while (remaining > 0) {
        const space = next - cur;
        if (remaining < space) {
          cur += remaining;
          remaining = 0;
        } else {
          remaining -= space;
          level += 1;
          cur = 0;
          next = computeNextLevelXP(level);
        }
      }

      setDisplayLevel(level);
      setDisplayLevelName(levelName(level));
      setDisplayCurrentXP(cur);
      setDisplayNextXP(next);

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // Commit award to source-of-truth store
        applyAwardInstant(award);
        setXpPop(true);
        window.setTimeout(() => setXpPop(false), 260);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xpProgress = useMemo(() => clampPercent((displayCurrentXP / displayNextXP) * 100), [displayCurrentXP, displayNextXP]);

  return (
    <GlassSurface className="p-3">
      <div className="flex flex-col gap-1.5">
        {/* Username */}
        <p className="text-white font-semibold text-sm leading-tight truncate">{user.name}</p>

        {/* XP row */}
        <div className="flex items-center gap-1.5">
          <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* XP text */}
        <p className="text-[10px] text-white/45">
          <span
            className={xpPop ? 'inline-block text-white font-semibold' : 'inline-block'}
            style={xpPop ? { transform: 'scale(1.12)', transition: 'transform 240ms ease' } : { transition: 'transform 240ms ease' }}
          >
            {displayCurrentXP}/{displayNextXP} XP
          </span>
          {' - '}
          {displayLevelName}
        </p>

        {/* Best score */}
        <p className="text-xs text-slate-400">Best: {user.bestScore.toLocaleString()}</p>
      </div>
    </GlassSurface>
  );
}
