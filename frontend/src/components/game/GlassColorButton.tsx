/**
 * Glass Color Button Component - Simon 2026
 * 
 * Glassmorphism styled button for the Simon game.
 * This is an ISOLATED component - does not replace existing buttons.
 * Swap into GlassSimonBoard when ready.
 */

import { forwardRef } from 'react';
import type { Color } from '../../shared/types';

// =============================================================================
// TYPES
// =============================================================================

interface GlassColorButtonProps {
  color: Color;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const GlassColorButton = forwardRef<HTMLButtonElement, GlassColorButtonProps>(
  ({ color, isActive, onClick, disabled = false, size = 'md', className = '' }, ref) => {
    
    // Size classes
    const sizeClasses = {
      sm: 'w-24 h-24 sm:w-28 sm:h-28',
      md: 'w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40',
      lg: 'w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48',
    };

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`
          glass-btn
          glass-btn--${color}
          ${isActive ? 'active' : ''}
          ${sizeClasses[size]}
          ${className}
        `}
        style={{ touchAction: 'manipulation' }}
        aria-label={`${color} button`}
        aria-pressed={isActive}
      >
        {/* Accessible label */}
        <span className="sr-only">{color}</span>
      </button>
    );
  }
);

GlassColorButton.displayName = 'GlassColorButton';

export default GlassColorButton;
