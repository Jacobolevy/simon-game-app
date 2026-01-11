import { AppShell } from '../ui/layout/AppShell';
import { UserProgressBadge } from './UserProgressBadge';
import { GameModeButton } from './GameModeButton';
import type { DashboardUserSummary } from './types';
import { SwordsIcon, UsersIcon, TargetIcon } from './icons';
import { UserAvatar } from './UserAvatar';

interface DashboardScreenProps {
  user: DashboardUserSummary;
  onSoloMode: () => void;
  onMultiplayer: () => void;
  onChallenges: () => void;
}

export function DashboardScreen({ user, onSoloMode, onMultiplayer, onChallenges }: DashboardScreenProps) {
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
    </AppShell>
  );
}

