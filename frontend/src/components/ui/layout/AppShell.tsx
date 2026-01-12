import type { ReactNode } from 'react';

export type AppShellVariant = 'default' | 'glass' | 'jelly';

interface AppShellProps {
  children: ReactNode;
  variant?: AppShellVariant;
  className?: string;
}

const variantBgClass: Record<AppShellVariant, string> = {
  default: '',
  glass: 'glass-ambient-bg',
  jelly: 'jelly-ambient-bg',
};

/**
 * AppShell - Mobile App Container
 *
 * CRITICAL: This is a MOBILE APPLICATION shell, not a web page.
 * - Fixed to viewport height (100dvh)
 * - NO SCROLLING by default
 * - Respects safe areas (notch, status bar, home indicator)
 * - Content must fit within the viewport
 */
export function AppShell({ children, variant = 'default', className = '' }: AppShellProps) {
  return (
    <div 
      className={`fixed inset-0 overflow-hidden ${className}`.trim()}
      style={{
        /* Lock to viewport - no scrolling */
        height: '100dvh',
        width: '100vw',
      }}
    >
      {/* Background layer */}
      {variant !== 'default' && (
        <div className={`absolute inset-0 ${variantBgClass[variant]}`} />
      )}

      {/* Content layer with safe area padding */}
      <div
        className="relative z-10 h-full w-full flex flex-col"
        style={{
          /* Safe area insets - compact app-scale padding */
          paddingLeft: 'max(12px, env(safe-area-inset-left))',
          paddingRight: 'max(12px, env(safe-area-inset-right))',
          paddingTop: 'max(8px, env(safe-area-inset-top))',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Centered content container - max width for larger screens */}
        <div className="mx-auto w-full max-w-md h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
