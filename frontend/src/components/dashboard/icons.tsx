import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export function UserIcon({ title = 'User', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <title>{title}</title>
      <path
        d="M20 21a8 8 0 10-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SwordsIcon({ title = 'Solo Mode', ...props }: IconProps) {
  // Simple crossed-swords icon
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <title>{title}</title>
      <path
        d="M5 3l5 5-2 2-5-5 2-2zM19 3l-5 5 2 2 5-5-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7 11l6 6M17 11l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 19l-2 2M15 19l2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UsersIcon({ title = 'Multiplayer', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <title>{title}</title>
      <path
        d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2.5 20a6 6 0 0111 0M10.5 20a6 6 0 0111 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TargetIcon({ title = 'Challenges', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <title>{title}</title>
      <path
        d="M12 22a10 10 0 110-20 10 10 0 010 20z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 18a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14a2 2 0 110-4 2 2 0 010 4z" fill="currentColor" />
    </svg>
  );
}

export function GiftIcon({ title = 'Rewards', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <title>{title}</title>
      <path d="M20 12v10H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 7h20v5H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

