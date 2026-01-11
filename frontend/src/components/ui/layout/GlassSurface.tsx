import type { ReactNode } from 'react';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function GlassSurface({ children, className = '' }: GlassSurfaceProps) {
  return (
    <div
      className={[
        'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 rounded-3xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

