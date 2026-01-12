/**
 * Landscape Warning Component
 * 
 * Shows a full-screen overlay when device is in landscape orientation
 * on mobile phones only. Desktop users are not affected.
 */

export function LandscapeWarning() {
  return (
    <div className="landscape-warning">
      <div className="flex flex-col items-center justify-center gap-3 text-white text-center px-4">
        <div className="text-4xl animate-bounce">
          📱
        </div>
        <h2 className="text-lg font-bold tracking-tight">
          Please Rotate Your Device
        </h2>
        <p className="text-sm text-white/80 max-w-xs">
          Simon Says works best in portrait mode
        </p>
        <div className="text-3xl mt-1">
          🔄
        </div>
      </div>
      
      <style>{`
        /* Show warning only on landscape MOBILE devices (touch + small screen) */
        .landscape-warning {
          display: none;
        }
        
        /* Only show on touch devices in landscape with very small height (phones) */
        @media (orientation: landscape) and (max-height: 450px) and (hover: none) and (pointer: coarse) {
          .landscape-warning {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            /* Respect safe areas even in this overlay */
            padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
              max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
          }
          
          /* Hide main content when warning is shown */
          body > #root > * {
            display: none;
          }
          
          body > #root > .landscape-warning {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
