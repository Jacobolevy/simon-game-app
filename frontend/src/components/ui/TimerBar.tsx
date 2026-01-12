/**
 * TimerBar Component
 * 
 * Visual countdown timer with color transitions.
 */


interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  /** Whether to show the numeric countdown */
  showNumber?: boolean;
  /** Optional className */
  className?: string;
}

export function TimerBar({ 
  timeRemaining, 
  totalTime, 
  showNumber = true,
  className = '' 
}: TimerBarProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  
  // Color based on remaining time
  const getBarColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const isUrgent = percentage <= 25;

  return (
    <div className={`w-full ${className}`}>
      {/* Timer bar container */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        {/* Animated fill */}
        <div 
          className={`
            absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-linear
            ${getBarColor()}
            ${isUrgent ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
        >
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: isUrgent 
                ? '0 0 10px rgba(239, 68, 68, 0.8)' 
                : 'none',
            }}
          />
        </div>
      </div>
      
      {/* Numeric countdown */}
      {showNumber && (
        <div className={`
          text-center mt-1 font-mono text-sm tabular-nums
          ${isUrgent ? 'text-red-400 animate-pulse font-bold' : 'text-white/70'}
        `}>
          {formatTime(timeRemaining)}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default TimerBar;
