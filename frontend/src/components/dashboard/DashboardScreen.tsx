/**
 * Dashboard Screen - Mobile App Style
 * 
 * MOBILE APP BEHAVIOR:
 * - Fixed viewport, no scrolling
 * - Compact spacing
 * - Content fits within safe areas
 */

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
  onOpenSettings?: () => void;
  notificationCount?: number;
}

export function DashboardScreen({
  user,
  onSoloMode,
  onMultiplayer,
  onChallenges,
  onOpenSettings,
  notificationCount = 0,
}: DashboardScreenProps) {

  return (
    <AppShell variant="jelly">
      {/* Fixed layout - no scrolling */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Top row: user info and avatar - compact */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div className="flex-1 max-w-[240px]">
            <UserProgressBadge user={user} />
          </div>
          <div>
            {onOpenSettings ? (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Profile & Settings"
                className="active:scale-[0.98] transition-transform"
                style={{ touchAction: 'manipulation' }}
              >
                <UserAvatar avatarUrl={user.avatarUrl} />
              </button>
            ) : (
              <UserAvatar avatarUrl={user.avatarUrl} />
            )}
          </div>
        </div>

        {/* Game Modes: centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="w-full flex flex-col items-center gap-2.5">
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
        </div>
      </div>

      {/* Gift Corner - Floating Action Button */}
      <button
        type="button"
        className="fixed w-12 h-12 rounded-full glass-btn glass-btn--red flex items-center justify-center hover:scale-110 transition-transform duration-300 z-50 shadow-xl"
        onClick={() => console.log("Open Rewards Modal")}
        aria-label="Rewards"
        style={{
          left: 'max(12px, env(safe-area-inset-left))',
          bottom: 'max(40px, calc(24px + env(safe-area-inset-bottom)))',
          animation: notificationCount > 0 ? 'bounce 3s infinite' : undefined,
        }}
      >
        <GiftIcon className="w-6 h-6 text-white drop-shadow-glow" />
        
        {notificationCount > 0 && (
          <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-lg border-2 border-[#151520]">
            {notificationCount}
          </div>
        )}
      </button>
    </AppShell>
  );
}
