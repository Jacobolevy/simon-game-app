/**
 * Main App Component - Simon 2026
 * 
 * Routes and navigation with Glassmorphism Pro aesthetic.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { GamePage } from './pages/GamePage';
import { DesignTestPage } from './pages/DesignTestPage';
import { EntryPage } from './pages/EntryPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { LandscapeWarning } from './components/ui/LandscapeWarning';

// =============================================================================
// APP COMPONENT
// =============================================================================

function App() {
  return (
    <BrowserRouter>
      <LandscapeWarning />
      <Routes>
        {/* Main Flow */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<DashboardPage />} />
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
