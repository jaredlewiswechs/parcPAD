import React from 'react';

interface LoadingTrailProps {
  message?: string;
  size?:    'sm' | 'md' | 'lg';
}

export const LoadingTrail: React.FC<LoadingTrailProps> = ({
  message = 'Connecting to Newton…',
  size    = 'md',
}) => {
  const w = size === 'sm' ? 80 : size === 'lg' ? 180 : 120;
  const h = size === 'sm' ? 24 : size === 'lg' ? 48  : 32;

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={message}>
      <svg
        width={w} height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Trail path background */}
        <path
          d={`M 8 ${h / 2} Q ${w * 0.25} ${h * 0.1} ${w * 0.5} ${h / 2} Q ${w * 0.75} ${h * 0.9} ${w - 8} ${h / 2}`}
          stroke="rgba(107,143,113,0.2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        {/* Animated trail dot */}
        <path
          d={`M 8 ${h / 2} Q ${w * 0.25} ${h * 0.1} ${w * 0.5} ${h / 2} Q ${w * 0.75} ${h * 0.9} ${w - 8} ${h / 2}`}
          stroke="#6B8F71"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="24 200"
          strokeDashoffset="200"
          style={{
            animation: 'trail-draw 1.8s ease-in-out infinite',
          }}
        />
        {/* Trail dots */}
        {[0.2, 0.4, 0.6, 0.8].map((pct, i) => (
          <circle
            key={i}
            cx={8 + pct * (w - 16)}
            cy={h / 2}
            r="2"
            fill="rgba(107,143,113,0.35)"
          />
        ))}
      </svg>
      {message && (
        <p className="text-sm text-stone-500 dark:text-stone-400 font-ui animate-pulse-soft">
          {message}
        </p>
      )}
    </div>
  );
};

export const LoadingPage: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingTrail message={message} size="lg" />
  </div>
);
