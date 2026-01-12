/**
 * AnimatedScore - Compact Mobile App Style
 */

import { useEffect, useRef, useState } from 'react';

interface AnimatedScoreProps {
  score: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
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
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  const themeClasses = {
    default: 'text-white',
    gold: 'text-yellow-400',
    muted: 'text-white/60',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-[8px] uppercase tracking-wider text-white/50 mb-0.5">
          {label}
        </span>
      )}
      <span 
        className={`
          font-semibold tabular-nums transition-transform duration-200
          ${sizeClasses[size]}
          ${themeClasses[theme]}
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
        style={{
          textShadow: theme === 'gold' 
            ? '0 0 8px rgba(250, 204, 21, 0.5)' 
            : 'none',
        }}
      >
        {score.toLocaleString()}
      </span>
    </div>
  );
}

export default AnimatedScore;
