import { useEffect, useMemo, useState } from 'react';

interface ProTipRotatorProps {
  tips: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * ProTipRotator
 * - Compact, mobile-friendly "contextual learning" ticker
 * - No scrolling, one-line tips
 */
export function ProTipRotator({ tips, intervalMs = 3500, className = '' }: ProTipRotatorProps) {
  const safeTips = useMemo(() => tips.filter(Boolean), [tips]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeTips.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeTips.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [safeTips.length, intervalMs]);

  if (safeTips.length === 0) return null;

  return (
    <div
      className={[
        'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2',
        'text-white/70 text-[11px] leading-snug',
        'flex items-start gap-2',
        className,
      ].join(' ')}
    >
      <span className="text-[12px] leading-none mt-[1px]" aria-hidden="true">
        💡
      </span>
      <span className="flex-1">
        {safeTips[index]}
      </span>
    </div>
  );
}

export default ProTipRotator;

