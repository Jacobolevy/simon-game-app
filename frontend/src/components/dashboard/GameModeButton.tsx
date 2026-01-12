import type { ReactNode } from 'react';

export type GameModeVariant = 'solo' | 'multi' | 'challenges';

const variantClasses: Record<GameModeVariant, string> = {
  solo: 'from-blue-500 to-indigo-600',
  multi: 'from-purple-500 to-pink-600',
  challenges: 'from-green-500 to-teal-600',
};

interface GameModeButtonProps {
  title: string;
  onClick: () => void;
  variant: GameModeVariant;
  icon?: ReactNode;
}

/**
 * GameModeButton - Compact Mobile Version
 */
export function GameModeButton({ title, onClick, variant, icon }: GameModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // Compact mobile sizing
        'w-full max-w-xs h-11 rounded-xl font-medium text-sm text-white relative overflow-hidden group border border-white/10',
        'bg-gradient-to-r',
        variantClasses[variant],
        'flex items-center justify-center gap-2',
        'transition-transform duration-150',
        'hover:scale-[1.01] active:scale-[0.98]',
        'shadow-md shadow-black/20',
      ].join(' ')}
      style={{ touchAction: 'manipulation' }}
    >
      {/* subtle highlight */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </span>
    </button>
  );
}
