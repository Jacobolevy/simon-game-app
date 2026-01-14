import { useEffect } from 'react';
import { useAnimation } from '../../hooks/useAnimation';

export type RulesInfoVariant = 'solo' | 'multiplayer';

interface RulesInfoModalProps {
  isOpen: boolean;
  variant: RulesInfoVariant;
  onClose: () => void;
}

/**
 * RulesInfoModal
 * - Compact, safe-area aware info sheet (no scrolling)
 * - Explains rules aligned with current code behavior
 */
export function RulesInfoModal({ isOpen, variant, onClose }: RulesInfoModalProps) {
  const { shouldRender, isEntering, isExiting } = useAnimation(isOpen, {
    enterDuration: 220,
    exitDuration: 180,
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const backdropClass = isEntering
    ? 'animate-in fade-in duration-150'
    : isExiting
      ? 'animate-out fade-out duration-150'
      : '';

  const modalClass = isEntering
    ? 'animate-in fade-in zoom-in-95 duration-200'
    : isExiting
      ? 'animate-out fade-out zoom-out-95 duration-180'
      : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Game rules info"
    >
      <button
        type="button"
        className={`absolute inset-0 ${backdropClass}`}
        style={{ background: 'rgba(0,0,0,0.72)' }}
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className={[
          'relative w-full max-w-[320px] rounded-2xl border border-white/15',
          'bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl shadow-2xl',
          'p-3.5 overflow-hidden',
          modalClass,
        ].join(' ')}
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-semibold text-sm">
            {variant === 'solo' ? 'Scoring (Solo)' : 'Rules (Survival)'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 active:scale-95 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {variant === 'solo' ? (
          <div className="space-y-2 text-[11px] text-white/75 leading-snug">
            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5">
              <div className="text-white/85 text-[10px] uppercase tracking-wider mb-1">
                How points work
              </div>
              <div className="space-y-1">
                <div>🎯 Correct tap: <span className="text-white font-semibold">+10</span></div>
                <div>🏁 Round bonus: <span className="text-white font-semibold">+round × 10</span></div>
                <div>⚡ Speed bonus: <span className="text-white font-semibold">bigger when you finish with more time left</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5">
              <div className="text-white/85 text-[10px] uppercase tracking-wider mb-1">
                Key idea
              </div>
              <div>
                Speed never subtracts points — it only adds. Finishing “in the green” gives a bigger speed bonus.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-[11px] text-white/75 leading-snug">
            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5">
              <div className="text-white/85 text-[10px] uppercase tracking-wider mb-1">
                Survival rules
              </div>
              <div className="space-y-1">
                <div>💀 Wrong sequence or timeout = eliminated</div>
                <div>👀 Eliminated players can stay and spectate (turns are skipped)</div>
                <div>🏆 Winner = last player standing</div>
              </div>
            </div>

            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5">
              <div className="text-white/85 text-[10px] uppercase tracking-wider mb-1">
                Tiebreakers (rare)
              </div>
              <div className="space-y-1">
                <div>1) Higher completed round wins</div>
                <div>2) If tied: higher score wins</div>
              </div>
            </div>

            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5">
              <div className="text-white/85 text-[10px] uppercase tracking-wider mb-1">
                Scoring (tie-break)
              </div>
              <div>
                The fastest correct submission for the round earns <span className="text-white font-semibold">+1</span>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RulesInfoModal;

