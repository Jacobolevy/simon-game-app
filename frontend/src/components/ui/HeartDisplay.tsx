/**
 * HeartDisplay Component
 * 
 * Displays lives as animated hearts with visual feedback.
 */


interface HeartDisplayProps {
  lives: number;
  maxLives: number;
  /** Index of heart currently animating (for gain/loss effects) */
  animatingIndex?: number;
  /** Type of animation to show */
  animationType?: 'lost' | 'gained' | 'none';
}

export function HeartDisplay({ 
  lives, 
  maxLives, 
  animatingIndex = -1,
  animationType = 'none'
}: HeartDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLives }, (_, i) => {
        const isFilled = i < lives;
        const isAnimating = i === animatingIndex;
        
        let animationClass = '';
        if (isAnimating) {
          if (animationType === 'lost') {
            animationClass = 'animate-heart-break';
          } else if (animationType === 'gained') {
            animationClass = 'animate-heart-pulse';
          }
        }
        
        return (
          <Heart 
            key={i} 
            filled={isFilled} 
            className={animationClass}
          />
        );
      })}
    </div>
  );
}

interface HeartProps {
  filled: boolean;
  className?: string;
}

function Heart({ filled, className = '' }: HeartProps) {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      className={`transition-all duration-300 ${className}`}
      style={{
        filter: filled ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'none',
      }}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? '#ef4444' : 'transparent'}
        stroke={filled ? '#ef4444' : 'rgba(255,255,255,0.3)'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// CSS animations (add to animations.css or inline styles)
const styles = `
@keyframes heart-break {
  0% { transform: scale(1); opacity: 1; }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.3; }
}

@keyframes heart-pulse {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1.1); }
  75% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

.animate-heart-break {
  animation: heart-break 0.5s ease-out;
}

.animate-heart-pulse {
  animation: heart-pulse 0.6s ease-in-out;
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('heart-animation-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'heart-animation-styles';
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default HeartDisplay;
