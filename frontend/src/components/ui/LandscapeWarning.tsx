/**
 * Landscape Warning Component
 * 
 * Shows a full-screen overlay when device is in landscape orientation
 * on small screens (mobile phones). Encourages users to rotate to portrait.
 */

export function LandscapeWarning() {
  return (
    <div className="landscape-warning">
      <div className="flex flex-col items-center justify-center gap-4 text-white">
        <div className="text-6xl animate-bounce">
          📱
        </div>
        <h2 className="text-2xl font-bold text-center px-4">
          Please Rotate Your Device
        </h2>
        <p className="text-lg text-center px-6 text-white/80">
          Simon Says works best in portrait mode
        </p>
        <div className="text-4xl mt-4">
          🔄
        </div>
      </div>
      
      <style>{`
        /* Show warning only on landscape mobile devices */
        .landscape-warning {
          display: none;
        }
        
        @media (orientation: landscape) and (max-height: 500px) {
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
