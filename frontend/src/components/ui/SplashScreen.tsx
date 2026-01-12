import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out after (duration - 500ms) to allow fade animation
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration - 500);

    // Complete after full duration
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 25%, #ef4444 50%, #eab308 75%, #22c55e 100%)',
        /* Fixed overlay bypasses AppShell padding. Respect safe areas. */
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        <img
          src="/splash.png"
          alt="Simon's Sequence"
          className="w-auto h-auto object-contain animate-pulse"
          style={{
            maxWidth: 'calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right) - 24px)',
            maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px)',
          }}
        />
      </div>
    </div>
  );
};
