import { AppShell } from '../ui/layout/AppShell';
import { UserProgressBadge } from './UserProgressBadge';
import { GameModeButton } from './GameModeButton';
import type { DashboardUserSummary } from './types';
import { SwordsIcon, UsersIcon, TargetIcon, GiftIcon } from './icons';
import { UserAvatar } from './UserAvatar';

interface DashboardScreenProps {
  user: DashboardUserSummary;
  onSoloMode: () => void;
  onMultiplayer: () => void;
  onChallenges: () => void;
  /** Total number of notifications for the Gift/Rewards button. 0 hides the badge. */
  notificationCount?: number;
}

export function DashboardScreen({
  user,
  onSoloMode,
  onMultiplayer,
  onChallenges,
  notificationCount = 0,
}: DashboardScreenProps) {

  return (
    <AppShell variant="jelly">
      {/* Top row: left progress badge + right avatar (separate components) */}
      <div className="pt-1 flex items-start justify-between gap-4">
        <div className="max-w-[280px]">
          <UserProgressBadge user={user} />
        </div>
        <div className="pt-1">
          <UserAvatar avatarUrl={user.avatarUrl} />
        </div>
      </div>

      {/* Game Modes */}
      <div className="mt-10 flex flex-col items-center space-y-3">
        <GameModeButton
          title="Solo Mode"
          onClick={onSoloMode}
          variant="solo"
          icon={<SwordsIcon className="w-4 h-4 text-white" />}
        />
        <GameModeButton
          title="Multiplayer"
          onClick={onMultiplayer}
          variant="multi"
          icon={<UsersIcon className="w-4 h-4 text-white" />}
        />
        <GameModeButton
          title="Challenges"
          onClick={onChallenges}
          variant="challenges"
          icon={<TargetIcon className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Gift Corner - Floating Action Button */}
      <button
        type="button"
        className="fixed w-16 h-16 rounded-full glass-btn glass-btn--red flex items-center justify-center hover:scale-110 transition-transform duration-300 z-50 shadow-xl"
        onClick={() => console.log("Open Rewards Modal")}
        aria-label="Rewards"
        style={{ left: 20, bottom: 20, animation: 'bounce 3s infinite' }}
      >
        <GiftIcon className="w-8 h-8 text-white drop-shadow-glow" />
        
        {/* Notification Badge */}
        {notificationCount > 0 && (
          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 px-1 flex items-center justify-center shadow-lg border-2 border-[#151520]">
            {notificationCount}
          </div>
        )}
      </button>
    </AppShell>
  );
}


