import { GlassSurface } from '../ui/layout/GlassSurface';
import type { DashboardUserSummary } from './types';
import { UserIcon } from './icons';

function clampPercent(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export function UserProfileHeader({ user }: { user: DashboardUserSummary }) {
  const xpProgress = clampPercent((user.currentXP / user.nextLevelXP) * 100);

  return (
    <GlassSurface className="p-4">
      <div className="w-full flex flex-col gap-3">
        {/* Top Row - Username and Avatar */}
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-base truncate pr-3">{user.name}</p>

          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 to-orange-500 border border-white/20 flex items-center justify-center shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* XP Progress Bar with Level */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-grow bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2.5 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex flex-col items-end leading-none shrink-0">
            <span className="text-xs text-white/70 font-semibold whitespace-nowrap">LVL {user.level}</span>
            <span className="text-[11px] text-white/45 whitespace-nowrap mt-1">
              {user.currentXP}/{user.nextLevelXP} XP
            </span>
          </div>
        </div>

        {/* Level Name */}
        <p className="text-sm text-slate-300">{user.levelName}</p>

        {/* Best Score */}
        <p className="text-sm text-slate-400">Best Score: {user.bestScore.toLocaleString()}</p>
      </div>
    </GlassSurface>
  );
}

