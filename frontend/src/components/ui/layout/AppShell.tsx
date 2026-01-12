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
 * AppShell
 *
 * A consistent full-screen page wrapper that:
 * - provides ambient background
 * - normalizes safe-area padding
 * - keeps content centered with a max width
 */
export function AppShell({ children, variant = 'default', className = '' }: AppShellProps) {
  return (
    {/* Avoid clipping fixed-position UI (e.g. Gift FAB) on iOS/WebViews */}
    <div className={`min-h-screen relative overflow-x-hidden ${className}`.trim()}>
      {/* Background */}
      {variant !== 'default' && <div className={`absolute inset-0 ${variantBgClass[variant]}`} />}

      {/* Content */}
      <div
        className="relative z-10 min-h-screen w-full sm:px-6 sm:pt-6 sm:pb-6"
        style={{
          paddingLeft: 'calc(16px + env(safe-area-inset-left))',
          paddingRight: 'calc(16px + env(safe-area-inset-right))',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

