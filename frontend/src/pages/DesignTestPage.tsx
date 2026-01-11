/**
 * Design Test Page - Simon 2026
 * 
 * Preview page for the Jelly Glass design system.
 * Access via /test route.
 * 
 * This page does NOT affect the main game flow.
 */

import { useState } from 'react';
import type { Color } from '../shared/types';
import { GlassButton, JellySimonBoard } from '../components/ui/glass';

// =============================================================================
// COMPONENT
// =============================================================================

export const DesignTestPage: React.FC = () => {
  const [activeButton, setActiveButton] = useState<Color | null>(null);
  const [clickLog, setClickLog] = useState<Color[]>([]);

  const handleButtonClick = (color: Color) => {
    setActiveButton(color);
    setClickLog((prev) => [...prev.slice(-7), color]);
    
    // Auto-reset after brief moment
    setTimeout(() => setActiveButton(null), 200);
  };

  const clearLog = () => setClickLog([]);

  return (
    <div className="min-h-screen jelly-ambient-bg p-4 sm:p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          🍬 Jelly Glass Design Test
        </h1>
        <p className="text-gray-400 text-sm">
          Preview the 3D gummy ball aesthetic
        </p>
        <a 
          href="/"
          className="inline-block mt-4 px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
        >
          ← Back to Game
        </a>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Section 1: Individual Buttons */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔘</span> Individual Buttons
          </h2>
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            
            {/* Size Comparison */}
            <div className="mb-8">
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Size Variants</h3>
              <div className="flex flex-wrap items-end gap-4 justify-center">
                <div className="text-center">
                  <GlassButton color="green" size="sm" onClick={() => handleButtonClick('green')} isActive={activeButton === 'green'} />
                  <p className="text-xs text-gray-500 mt-2">SM</p>
                </div>
                <div className="text-center">
                  <GlassButton color="red" size="md" onClick={() => handleButtonClick('red')} isActive={activeButton === 'red'} />
                  <p className="text-xs text-gray-500 mt-2">MD</p>
                </div>
                <div className="text-center">
                  <GlassButton color="yellow" size="lg" onClick={() => handleButtonClick('yellow')} isActive={activeButton === 'yellow'} />
                  <p className="text-xs text-gray-500 mt-2">LG</p>
                </div>
                <div className="text-center">
                  <GlassButton color="blue" size="xl" onClick={() => handleButtonClick('blue')} isActive={activeButton === 'blue'} />
                  <p className="text-xs text-gray-500 mt-2">XL</p>
                </div>
              </div>
            </div>

            {/* All Colors */}
            <div className="mb-8">
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">All Colors (Large)</h3>
              <div className="flex flex-wrap gap-6 justify-center">
                {(['green', 'red', 'yellow', 'blue'] as Color[]).map((color) => (
                  <GlassButton
                    key={color}
                    color={color}
                    size="lg"
                    onClick={() => handleButtonClick(color)}
                    isActive={activeButton === color}
                  />
                ))}
              </div>
            </div>

            {/* Active State Demo */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Active State (Always On)</h3>
              <div className="flex flex-wrap gap-6 justify-center">
                {(['green', 'red', 'yellow', 'blue'] as Color[]).map((color) => (
                  <GlassButton
                    key={`active-${color}`}
                    color={color}
                    size="md"
                    isActive={true}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Full Board - PROMINENT */}
        <section className="py-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center justify-center gap-2">
            <span className="text-2xl">🎮</span> Complete Board (Demo Mode)
          </h2>
          {/* Board centered without extra container - the board has its own glass styling */}
          <div className="flex justify-center items-center">
            <JellySimonBoard demoMode={true} />
          </div>
        </section>

        {/* Section 3: Click Log */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> Click Log
          </h2>
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400 text-sm">Recent clicks:</span>
              {clickLog.length > 0 && (
                <button 
                  onClick={clearLog}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {clickLog.length === 0 ? (
                <span className="text-gray-500 text-sm">Click buttons above to log...</span>
              ) : (
                clickLog.map((color, idx) => (
                  <span
                    key={idx}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${color === 'green' ? 'bg-green-500/30 text-green-300' : ''}
                      ${color === 'red' ? 'bg-red-500/30 text-red-300' : ''}
                      ${color === 'yellow' ? 'bg-yellow-500/30 text-yellow-300' : ''}
                      ${color === 'blue' ? 'bg-blue-500/30 text-blue-300' : ''}
                    `}
                  >
                    {color}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Disabled State */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🚫</span> Disabled State
          </h2>
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex flex-wrap gap-6 justify-center">
              {(['green', 'red', 'yellow', 'blue'] as Color[]).map((color) => (
                <GlassButton
                  key={`disabled-${color}`}
                  color={color}
                  size="md"
                  disabled={true}
                  onClick={() => {}}
                />
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">
              Disabled buttons are semi-transparent and non-interactive
            </p>
          </div>
        </section>

        {/* Design Notes */}
        <section className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">📐 Design Notes</h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>3D Convex Effect:</strong> Inset shadows create the gummy ball depth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>Specular Highlights:</strong> White ellipse overlay simulates light reflection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>Inner Glow (Active):</strong> Radial gradient from center when lit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>Outer Glow (Active):</strong> Multiple layered box-shadows for halo effect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>Glass Effect:</strong> backdrop-blur + semi-transparent background</span>
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-500 text-sm">
        Simon 2026 • Jelly Glass Design System
      </footer>
    </div>
  );
};

export default DesignTestPage;
