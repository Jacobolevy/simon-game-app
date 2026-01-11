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

export function GameModeButton({ title, onClick, variant, icon }: GameModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // Mobile-first sizing: keep buttons "above the fold" across device heights.
        // Uses clamp() so spacing scales with viewport height but stays within sane bounds.
        'w-full max-w-sm py-[clamp(12px,2.2vh,14px)] rounded-2xl font-semibold text-[clamp(13px,1.8vh,15px)] text-white relative overflow-hidden group border border-white/10',
        'bg-gradient-to-r',
        variantClasses[variant],
        'flex items-center justify-center gap-2',
        'transition-transform duration-150',
        'hover:scale-[1.01] active:scale-[0.98]',
        'shadow-lg shadow-black/20',
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

