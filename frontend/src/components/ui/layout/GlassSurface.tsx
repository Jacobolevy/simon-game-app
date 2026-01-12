import type { ReactNode } from 'react';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * GlassSurface - Compact Glass Panel
 * 
 * MOBILE APP: Uses compact border radius (16px instead of 24px)
 */
export function GlassSurface({ children, className = '' }: GlassSurfaceProps) {
  return (
    <div
      className={[
        'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 rounded-2xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
