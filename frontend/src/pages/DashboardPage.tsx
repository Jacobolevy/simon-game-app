/**
 * Dashboard Page - Simon 2026
 * 
 * Central Hub: Game modes + user progression.
 * Visual Style: Premium Glassmorphism & Neon Jelly.
 */

import { useNavigate } from 'react-router-dom';
import { DashboardScreen } from '../components/dashboard/DashboardScreen';
import type { DashboardUserSummary } from '../components/dashboard/types';

export function DashboardPage() {
  const navigate = useNavigate();

  // Mock user data for now (Google avatar/settings wiring comes later).
  const mockUser: DashboardUserSummary = {
    name: 'Guest Player',
    avatarUrl: null,
    level: 1,
    currentXP: 300,
    nextLevelXP: 1000,
    levelName: 'Beginner',
    bestScore: 1250,
  };

  return (
    <DashboardScreen
      user={mockUser}
      onSoloMode={() => navigate('/game')}
      onMultiplayer={() => navigate('/entry')}
      onChallenges={() => console.log('Challenges clicked')}
    />
  );
}

export default DashboardPage;
