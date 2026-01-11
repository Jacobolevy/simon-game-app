import React from 'react';

export const SimonLogo = ({ className = 'w-40 h-auto' }: { className?: string }) => {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="simon-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Gap / background */}
      <rect width="100%" height="100%" fill="#0b0f1a" />

      {/* Rotated group */}
      <g transform="translate(160 160) rotate(20)" filter="url(#simon-glow)">
        {/* RED */}
        <path
          d="
            M 10 -95
            A 95 95 0 0 1 95 -10
            L 45 -10
            A 45 45 0 0 0 10 -45
            Z"
          fill="#ff3b3b"
        >
          <animate attributeName="opacity" values="0.45;1;0.45" dur="2s" repeatCount="indefinite" begin="0s" />
        </path>

        {/* BLUE */}
        <path
          d="
            M 95 10
            A 95 95 0 0 1 10 95
            L 10 45
            A 45 45 0 0 0 45 10
            Z"
          fill="#3b6bff"
        >
          <animate attributeName="opacity" values="0.45;1;0.45" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </path>

        {/* YELLOW */}
        <path
          d="
            M -10 95
            A 95 95 0 0 1 -95 10
            L -45 10
            A 45 45 0 0 0 -10 45
            Z"
          fill="#ffd23b"
        >
          <animate attributeName="opacity" values="0.45;1;0.45" dur="2s" repeatCount="indefinite" begin="1s" />
        </path>

        {/* GREEN */}
        <path
          d="
            M -95 -10
            A 95 95 0 0 1 -10 -95
            L -10 -45
            A 45 45 0 0 0 -45 -10
            Z"
          fill="#3bff8f"
        >
          <animate attributeName="opacity" values="0.45;1;0.45" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </path>
      </g>
    </svg>
  );
};

