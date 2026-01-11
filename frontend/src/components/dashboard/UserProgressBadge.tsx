import { GlassSurface } from '../ui/layout/GlassSurface';
import type { DashboardUserSummary } from './types';

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export function UserProgressBadge({ user }: { user: DashboardUserSummary }) {
  const xpProgress = clampPercent((user.currentXP / user.nextLevelXP) * 100);

  return (
    <GlassSurface className="p-4">
      <div className="flex flex-col gap-2">
        {/* Username */}
        <p className="text-white font-bold text-base leading-tight truncate">{user.name}</p>

        {/* XP row */}
        <div className="flex items-center gap-2">
          {/* keep bar compact (doesn't fill screen width) */}
          <div className="w-44 sm:w-52 bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2.5 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* XP text */}
        <p className="text-[11px] text-white/45">
          {user.currentXP}/{user.nextLevelXP} XP - {user.levelName}
        </p>

        {/* Best score */}
        <p className="text-sm text-slate-400">Best Score: {user.bestScore.toLocaleString()}</p>
      </div>
    </GlassSurface>
  );
}

