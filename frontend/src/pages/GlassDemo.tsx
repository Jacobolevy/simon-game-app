/**
 * Glass Demo Page - Simon 2026
 * 
 * Preview page for testing the Glassmorphism components.
 * Route: /glass-demo
 * 
 * This is a DEVELOPMENT-ONLY page for previewing the new design.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Color } from '../shared/types';
import { GlassColorButton } from '../components/game/GlassColorButton';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';

export const GlassDemo: React.FC = () => {
  const navigate = useNavigate();
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [clickedSequence, setClickedSequence] = useState<Color[]>([]);

  const colors: Color[] = ['green', 'red', 'yellow', 'blue'];

  const handleClick = (color: Color) => {
    setActiveColor(color);
    setClickedSequence(prev => [...prev, color]);
    
    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Reset active state after animation
    setTimeout(() => setActiveColor(null), 200);
  };

  const resetDemo = () => {
    setClickedSequence([]);
    setActiveColor(null);
  };

  const getColorEmoji = (color: Color): string => {
    const emojis: Record<Color, string> = {
      red: '🔴',
      blue: '🔵',
      yellow: '🟡',
      green: '🟢',
    };
    return emojis[color];
  };

  return (
    <AppShell variant="glass" className="justify-center">
      <div className="flex flex-col items-center">
        <header className="w-full flex items-center justify-between py-1">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="h-10 px-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Back
          </button>
          <div className="text-center">
            <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Dev</div>
            <div className="text-sm font-bold text-white tracking-tight">Glass UI</div>
          </div>
          <button
            type="button"
            onClick={resetDemo}
            className="h-10 px-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Reset
          </button>
        </header>

        <main className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3">
          <GlassSurface className="p-4 w-full max-w-sm">
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              {colors.map((color) => (
                <GlassColorButton
                  key={color}
                  color={color}
                  isActive={activeColor === color}
                  onClick={() => handleClick(color)}
                  disabled={false}
                  size="lg"
                />
              ))}
            </div>
          </GlassSurface>

          <GlassSurface className="p-3 w-full max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Sequence</span>
              <span className="text-[10px] text-white/40">{clickedSequence.length}/∞</span>
            </div>
            <div className="mt-2 flex justify-center items-center gap-2 min-h-[32px] flex-wrap">
              {clickedSequence.length === 0 ? (
                <span className="text-xs text-white/35">Tap colors above</span>
              ) : (
                clickedSequence.slice(-12).map((color, i) => (
                  <span key={`${color}-${i}`} className="text-xl">
                    {getColorEmoji(color)}
                  </span>
                ))
              )}
            </div>
          </GlassSurface>
        </main>
      </div>
    </AppShell>
  );
};

export default GlassDemo;
