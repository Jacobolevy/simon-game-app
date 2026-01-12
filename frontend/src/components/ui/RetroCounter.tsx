/**
 * RetroCounter Component
 * 
 * Animated score counter with retro slot-machine style rolling numbers.
 */

import React, { useEffect, useState, useRef } from 'react';

interface RetroCounterProps {
  value: number;
  /** Duration of count animation in ms */
  duration?: number;
  /** Callback when counting finishes */
  onComplete?: () => void;
  /** Size variant */
  size?: 'md' | 'lg' | 'xl';
  /** Whether to show flash effects */
  showFlash?: boolean;
}

export function RetroCounter({
  value,
  duration = 2000,
  onComplete,
  size = 'lg',
  showFlash = true,
}: RetroCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false;
    const startValue = 0;
    const endValue = value;
    
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(startValue + (endValue - startValue) * eased);
      setDisplayValue(currentValue);
      
      // Flash effect at milestones
      if (showFlash && currentValue > 0 && currentValue % 100 === 0) {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 100);
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, onComplete, showFlash]);

  const sizeClasses = {
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  return (
    <div 
      className={`
        font-mono font-bold tabular-nums
        ${sizeClasses[size]}
        ${isFlashing ? 'text-yellow-300' : 'text-white'}
        transition-colors duration-100
      `}
      style={{
        textShadow: isFlashing 
          ? '0 0 20px rgba(253, 224, 71, 0.8)' 
          : '0 0 10px rgba(255, 255, 255, 0.3)',
      }}
    >
      {displayValue.toLocaleString()}
    </div>
  );
}

export default RetroCounter;
