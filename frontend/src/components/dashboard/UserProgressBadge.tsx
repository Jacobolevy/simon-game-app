import { GlassSurface } from '../ui/layout/GlassSurface';
import type { DashboardUserSummary } from './types';

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

/**
 * UserProgressBadge - Compact Mobile Version
 */
export function UserProgressBadge({ user }: { user: DashboardUserSummary }) {
  const xpProgress = clampPercent((user.currentXP / user.nextLevelXP) * 100);

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
          {user.currentXP}/{user.nextLevelXP} XP - {user.levelName}
        </p>

        {/* Best score */}
        <p className="text-xs text-slate-400">Best: {user.bestScore.toLocaleString()}</p>
      </div>
    </GlassSurface>
  );
}
