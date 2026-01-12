/**
 * AnimatedModal Component
 * 
 * Wrapper for modals with consistent spring entrance and staggered content.
 */

import type { ReactNode } from 'react';
import { useAnimation } from '../../hooks/useAnimation';

interface AnimatedModalProps {
  isOpen: boolean;
  children: ReactNode;
  /** Optional className for the modal container */
  className?: string;
  /** Background variant */
  variant?: 'default' | 'dark' | 'danger' | 'success' | 'gold';
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

export function AnimatedModal({
  isOpen,
  children,
  className = '',
  variant = 'default',
  onAnimationComplete,
}: AnimatedModalProps) {
  const { shouldRender, isEntering, isExiting, isEntered } = useAnimation(isOpen, {
    enterDuration: 400,
    exitDuration: 250,
    onEntered: onAnimationComplete,
  });

  if (!shouldRender) return null;

  const backdropVariants = {
    default: 'bg-black/60',
    dark: 'bg-black/80',
    danger: 'bg-black/70',
    success: 'bg-black/60',
    gold: 'bg-black/70',
  };

  const modalVariants = {
    default: 'from-white/15 to-white/5 border-white/20',
    dark: 'from-gray-900/90 to-black/80 border-white/10',
    danger: 'from-red-900/40 to-black/60 border-red-500/30',
    success: 'from-green-900/40 to-black/60 border-green-500/30',
    gold: 'from-yellow-600/30 to-purple-900/40 border-yellow-500/50',
  };

  const animationState = isEntering 
    ? 'entering' 
    : isExiting 
    ? 'exiting' 
    : isEntered 
    ? 'entered' 
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 backdrop-blur-sm
          ${backdropVariants[variant]}
          ${isEntering ? 'animate-fade-in' : ''}
          ${isExiting ? 'animate-fade-out' : ''}
        `}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-sm
          bg-gradient-to-b ${modalVariants[variant]}
          backdrop-blur-xl rounded-2xl
          border shadow-2xl
          p-6
          ${isEntering ? 'animate-spring' : ''}
          ${isExiting ? 'animate-scale-out' : ''}
          ${className}
        `}
        data-state={animationState}
      >
        {/* Staggered content wrapper */}
        <div className={isEntered ? 'stagger-children' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AnimatedModal;
