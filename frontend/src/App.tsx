/**
 * Main App Component
 * 
 * Routes and navigation.
 */

import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EntryPage } from './pages/EntryPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { GlassDemo } from './pages/GlassDemo';
import { LandscapeWarning } from './components/ui/LandscapeWarning';
import { SplashScreen } from './components/ui/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <BrowserRouter>
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={3000} />
      )}
      <LandscapeWarning />
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/waiting" element={<WaitingRoomPage />} />
        <Route path="/glass-demo" element={<GlassDemo />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
