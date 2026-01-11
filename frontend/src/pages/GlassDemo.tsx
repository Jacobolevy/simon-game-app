/**
 * Glass Demo Page - Simon 2026
 * 
 * Preview page for testing the Glassmorphism components.
 * Route: /glass-demo
 * 
 * This is a DEVELOPMENT-ONLY page for previewing the new design.
 */

import { useState } from 'react';
import type { Color } from '../shared/types';
import { GlassColorButton } from '../components/game/GlassColorButton';

export const GlassDemo: React.FC = () => {
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
    <div className="min-h-screen glass-ambient-bg flex flex-col items-center justify-center p-6 gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">
          <span className="neon-text neon-text--blue">SIMON</span> 2026
        </h1>
        <p className="text-gray-400 text-sm">Glassmorphism UI Preview</p>
      </div>

      {/* Glass Container with Buttons */}
      <div className="glass-container p-8 relative">
        <div className="grid grid-cols-2 gap-6">
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
      </div>

      {/* Clicked Sequence Display */}
      <div className="glass-panel p-4 min-w-[200px]">
        <p className="text-xs text-gray-500 text-center mb-2">SEQUENCE</p>
        <div className="flex justify-center items-center gap-2 min-h-[40px] flex-wrap">
          {clickedSequence.length === 0 ? (
            <span className="text-gray-600 text-sm">Click buttons above</span>
          ) : (
            clickedSequence.map((color, i) => (
              <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 50}ms` }}>
                {getColorEmoji(color)}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetDemo}
        className="glass-panel px-6 py-3 text-white hover:bg-white/10 transition-colors"
      >
        🔄 Reset
      </button>

      {/* States Demo */}
      <div className="glass-panel p-6 w-full max-w-md">
        <h3 className="text-white font-bold mb-4 text-center">Button States</h3>
        <div className="flex justify-around items-center gap-4">
          {/* Normal */}
          <div className="text-center">
            <GlassColorButton
              color="green"
              isActive={false}
              onClick={() => {}}
              disabled={false}
              size="sm"
            />
            <p className="text-xs text-gray-500 mt-2">Normal</p>
          </div>
          
          {/* Active */}
          <div className="text-center">
            <GlassColorButton
              color="red"
              isActive={true}
              onClick={() => {}}
              disabled={false}
              size="sm"
            />
            <p className="text-xs text-gray-500 mt-2">Active</p>
          </div>
          
          {/* Disabled */}
          <div className="text-center">
            <GlassColorButton
              color="blue"
              isActive={false}
              onClick={() => {}}
              disabled={true}
              size="sm"
            />
            <p className="text-xs text-gray-500 mt-2">Disabled</p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <a 
        href="/" 
        className="text-gray-500 hover:text-white transition-colors text-sm"
      >
        ← Back to Home
      </a>
    </div>
  );
};

export default GlassDemo;
