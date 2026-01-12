/**
 * AnimatedScore Component
 * 
 * Displays a score with pop animation when it changes.
 */

import { useEffect, useRef, useState } from 'react';

interface AnimatedScoreProps {
  score: number;
  label?: string;
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  theme?: 'default' | 'gold' | 'muted';
}

export function AnimatedScore({ 
  score, 
  label,
  className = '',
  size = 'md',
  theme = 'default',
}: AnimatedScoreProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScoreRef = useRef(score);
  
  useEffect(() => {
    if (score !== prevScoreRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      prevScoreRef.current = score;
      return () => clearTimeout(timer);
    }
  }, [score]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const themeClasses = {
    default: 'text-white',
    gold: 'text-yellow-400',
    muted: 'text-white/60',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-xs uppercase tracking-wider text-white/50 mb-0.5">
          {label}
        </span>
      )}
      <span 
        className={`
          font-bold tabular-nums transition-transform duration-200
          ${sizeClasses[size]}
          ${themeClasses[theme]}
          ${isAnimating ? 'scale-125' : 'scale-100'}
        `}
        style={{
          textShadow: theme === 'gold' 
            ? '0 0 10px rgba(250, 204, 21, 0.5)' 
            : 'none',
        }}
      >
        {score.toLocaleString()}
      </span>
    </div>
  );
}

export default AnimatedScore;
