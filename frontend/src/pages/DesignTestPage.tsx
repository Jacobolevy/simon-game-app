/**
 * Design Test Page - Simon 2026
 * 
 * Preview page for the Jelly Glass design system.
 * Access via /test route.
 * 
 * This page does NOT affect the main game flow.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Color } from '../shared/types';
import { GlassButton, JellySimonBoard } from '../components/ui/glass';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';

// =============================================================================
// COMPONENT
// =============================================================================

type DesignTab = 'board' | 'buttons' | 'log';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export const DesignTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState<Color | null>(null);
  const [clickLog, setClickLog] = useState<Color[]>([]);
  const [tab, setTab] = useState<DesignTab>('board');
  const [size, setSize] = useState<ButtonSize>('lg');

  const handleButtonClick = (color: Color) => {
    setActiveButton(color);
    setClickLog((prev) => [...prev.slice(-7), color]);
    
    // Auto-reset after brief moment
    setTimeout(() => setActiveButton(null), 200);
  };

  const clearLog = () => setClickLog([]);

  const tabButtonClass = useMemo(
    () => (t: DesignTab) =>
      [
        'h-9 rounded-xl text-xs font-semibold transition-colors active:scale-[0.98]',
        'border border-white/10',
        tab === t ? 'bg-white text-slate-900' : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white',
      ].join(' '),
    [tab]
  );

  const sizeButtonClass = useMemo(
    () => (s: ButtonSize) =>
      [
        'h-8 rounded-xl text-[10px] font-semibold transition-colors active:scale-[0.98]',
        'border border-white/10',
        size === s ? 'bg-white/15 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white',
      ].join(' '),
    [size]
  );

  return (
    <AppShell variant="jelly">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 py-1">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="h-10 px-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          ← Back
        </button>

        <div className="text-center">
          <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Design</div>
          <div className="text-sm font-bold text-white tracking-tight">Jelly Glass</div>
        </div>

        {/* Spacer to keep title centered */}
        <div className="w-[72px]" aria-hidden="true" />
      </header>

      {/* Tabs */}
      <GlassSurface className="p-2 rounded-2xl">
        <div className="grid grid-cols-3 gap-1">
          <button type="button" className={tabButtonClass('board')} onClick={() => setTab('board')}>
            Board
          </button>
          <button type="button" className={tabButtonClass('buttons')} onClick={() => setTab('buttons')}>
            Buttons
          </button>
          <button type="button" className={tabButtonClass('log')} onClick={() => setTab('log')}>
            Log
          </button>
        </div>
      </GlassSurface>

      {/* Content (must fit on one screen) */}
      <main className="flex-1 min-h-0 flex items-center justify-center">
        {tab === 'board' && <JellySimonBoard demoMode={true} />}

        {tab === 'buttons' && (
          <div className="w-full flex flex-col items-center gap-3">
            <GlassSurface className="w-full p-2 rounded-2xl">
              <div className="grid grid-cols-4 gap-1">
                {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                  <button key={s} type="button" className={sizeButtonClass(s)} onClick={() => setSize(s)}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </GlassSurface>

            <div className="grid grid-cols-2 gap-4">
              {(['green', 'red', 'yellow', 'blue'] as const).map((color) => (
                <GlassButton
                  key={color}
                  color={color}
                  size={size}
                  onClick={() => handleButtonClick(color)}
                  isActive={activeButton === color}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <span>Tap to preview</span>
              <span className="opacity-40">•</span>
              <span>Size: {size.toUpperCase()}</span>
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div className="w-full flex flex-col items-center gap-3">
            <GlassSurface className="w-full p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Recent taps</span>
                <button
                  type="button"
                  onClick={clearLog}
                  disabled={clickLog.length === 0}
                  className="h-9 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5 transition-colors active:scale-[0.98]"
                >
                  Clear
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {clickLog.length === 0 ? (
                  <span className="text-xs text-white/35">Tap colors in Buttons tab to populate.</span>
                ) : (
                  clickLog.map((color, idx) => (
                    <span
                      key={idx}
                      className={[
                        'px-2.5 py-1 rounded-full text-xs font-semibold',
                        color === 'green' ? 'bg-green-500/25 text-green-200' : '',
                        color === 'red' ? 'bg-red-500/25 text-red-200' : '',
                        color === 'yellow' ? 'bg-yellow-500/25 text-yellow-200' : '',
                        color === 'blue' ? 'bg-blue-500/25 text-blue-200' : '',
                      ].join(' ')}
                    >
                      {color}
                    </span>
                  ))
                )}
              </div>
            </GlassSurface>

            <button
              type="button"
              onClick={() => setTab('buttons')}
              className="h-11 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              Go tap buttons
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
};

export default DesignTestPage;
