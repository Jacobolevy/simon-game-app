/**
 * Dashboard Page - Simon 2026
 * 
 * Central Hub: Core Loop (Play), Meta-Game (Galaxy), Social (Leaderboards).
 * Visual Style: Premium Glassmorphism & Neon Jelly.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Trophy, Settings, User, ShoppingBag } from 'lucide-react';

// --- Sub-Components ---

/**
 * Store Button (Top Left)
 * Static icon with conditional Android-style notification badge.
 */
const StoreButton: React.FC<{ hasNotification: boolean }> = ({ hasNotification }) => {
  return (
    <button 
      className="
        relative group 
        bg-white/5 backdrop-blur-md border border-white/10 
        p-3 rounded-full 
        hover:bg-white/10 transition-all duration-200
        shadow-lg active:scale-95
      "
      aria-label="Store"
    >
      <ShoppingBag className="text-white w-6 h-6 drop-shadow-sm" />
      
      {/* Android-style Notification Badge */}
      {hasNotification && (
        <span className="absolute top-0 right-0 flex h-3 w-3 -mr-1 -mt-1">
          {/* Ping effect for attention */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          {/* Actual dot */}
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-950"></span>
        </span>
      )}
    </button>
  );
};

/**
 * User Profile Capsule (Top Right)
 * Floating glass capsule with Avatar and Level.
 */
const ProfileCapsule: React.FC = () => {
  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1.5 pl-4 shadow-lg">
      <div className="flex flex-col items-end mr-1">
        <span className="text-white font-bold text-xs leading-none tracking-wide">Guest</span>
        <span className="text-indigo-300 text-[10px] font-medium tracking-wider">LVL 1</span>
      </div>
      
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-inner">
         <User size={18} className="text-white/90" />
      </div>
    </div>
  );
};

/**
 * Bottom Navigation (Floating Dock)
 */
const GlassDock: React.FC = () => {
  const navItems = [
    { icon: Map, label: 'Galaxy', active: false },
    { icon: Trophy, label: 'Rank', active: true },
    { icon: Settings, label: 'Config', active: false },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm h-20 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-around px-2 z-50">
      {navItems.map((item, index) => (
        <button
          key={index}
          className={`
            flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300
            ${item.active 
              ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
              : 'text-slate-500 hover:text-white hover:bg-white/5'}
          `}
        >
          <item.icon 
            size={24} 
            strokeWidth={item.active ? 2.5 : 2}
            className={item.active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}
          />
          <span className="text-[10px] font-medium tracking-wide">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

/**
 * Main Dashboard Page
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  // Mock logic: "Si hay algo de verdad" -> true
  const [hasStoreNotification] = useState(true);

  const handlePlay = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black pointer-events-none z-0" />

      {/* Main Content Layout */}
      <div className="flex-1 w-full max-w-md p-6 flex flex-col justify-between z-10 h-screen relative">
        
        {/* TOP BAR: Split Left (Store) and Right (Profile) */}
        <header className="w-full flex items-center justify-between z-20 pt-2">
          {/* Left Corner: Store */}
          <StoreButton hasNotification={hasStoreNotification} />
          
          {/* Right Corner: Profile */}
          <ProfileCapsule />
        </header>

        {/* CENTER STAGE: Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full">
          
          {/* The "Play" Button (Jelly Orb) */}
          <button
            onClick={handlePlay}
            className="
              relative group
              w-48 h-48 rounded-full
              bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600
              flex items-center justify-center
              cursor-pointer
              transition-all duration-300
              active:scale-95 active:shadow-none
              border-4 border-white/10
              shadow-[inset_0_4px_20px_rgba(255,255,255,0.3),0_0_40px_rgba(124,58,237,0.5)]
              hover:shadow-[inset_0_4px_25px_rgba(255,255,255,0.4),0_0_60px_rgba(124,58,237,0.7)]
              animate-pulse-slow
            "
            style={{ animationDuration: '3s' }}
          >
            <span className="text-3xl font-black text-white tracking-[0.2em] drop-shadow-md ml-1">
              PLAY
            </span>
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 bg-white/20 rounded-full blur-xl pointer-events-none" />
          </button>

          {/* Stats */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-xs tracking-[0.2em] font-bold mb-1 uppercase">
              Best Score
            </p>
            <p className="text-2xl text-white font-mono font-medium drop-shadow-lg">
              0
            </p>
          </div>
        </div>

        {/* Spacer for Dock */}
        <div className="h-20" /> 
      </div>

      {/* FIXED DOCK */}
      <GlassDock />
      
    </div>
  );
};

export default DashboardPage;
