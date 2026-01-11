/**
 * Main App Component - Simon 2026
 * 
 * Routes and navigation with Glassmorphism Pro aesthetic.
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { GamePage } from './pages/GamePage';
import { DesignTestPage } from './pages/DesignTestPage';
import { EntryPage } from './pages/EntryPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { LandscapeWarning } from './components/ui/LandscapeWarning';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import type { DashboardUserSummary } from './components/dashboard/types';

// =============================================================================
// APP COMPONENT
// =============================================================================

function HomeRoute() {
  const navigate = useNavigate();

  const user: DashboardUserSummary = {
    name: 'Guest Player',
    avatarUrl: null,
    level: 1,
    currentXP: 120,
    nextLevelXP: 300,
    levelName: 'Rookie',
    bestScore: 1250,
  };

  return (
    <DashboardScreen
      user={user}
      onSoloMode={() => navigate('/game')}
      onMultiplayer={() => navigate('/entry')}
      onChallenges={() => navigate('/test')}
      notificationCount={0}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <LandscapeWarning />
      <Routes>
        {/* Main Flow */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/game" element={<GamePage />} />

        {/* Multiplayer Flow */}
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/waiting" element={<WaitingRoomPage />} />
        
        {/* Design Testing (temporary) */}
        <Route path="/test" element={<DesignTestPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
