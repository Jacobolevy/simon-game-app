/**
 * Jelly Glass Button Component - Simon 2026
 * 
 * 3D "Gummy Ball" styled button with glassmorphism effects.
 * Features:
 * - Perfect circular shape (rounded-full)
 * - 3D convex appearance via radial gradients
 * - Glass effect with backdrop blur
 * - Inset shadows for depth (light top, shadow bottom)
 * - Active state with inner + outer glow
 */

import { forwardRef } from 'react';
import type { Color } from '../../../shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface GlassButtonProps {
  /** Color variant */
  color: Color;
  /** Whether the button is in active/lit state */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const sizeClasses: Record<GlassButtonProps['size'] & string, string> = {
  sm: 'jelly-btn--sm',
  md: 'jelly-btn--md',
  lg: 'jelly-btn--lg',
  xl: 'jelly-btn--xl',
};

// =============================================================================
// COMPONENT
// =============================================================================

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      color,
      isActive = false,
      onClick,
      disabled = false,
      size = 'lg',
      className = '',
      ariaLabel,
    },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick();
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          jelly-btn
          jelly-btn--${color}
          ${sizeClasses[size]}
          ${isActive ? 'jelly-active' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        aria-label={ariaLabel || `${color} button`}
        aria-pressed={isActive}
      >
        {/* Screen reader only label */}
        <span className="sr-only">{color}</span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
