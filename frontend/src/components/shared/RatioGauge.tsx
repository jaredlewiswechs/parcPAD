import React from 'react';
import { clsx } from '@/lib/clsx';

interface RatioGaugeProps {
  f:          number;
  g:          number;
  className?: string;
}

function ratioColor(ratio: number): string {
  if (ratio >= 1.0) return '#9B2D30';   // berry — finfr
  if (ratio >= 0.67) return '#D4845A';  // sunset
  if (ratio >= 0.34) return '#C9A84C';  // gold
  return '#6B8F71';                      // sage — safe
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export const RatioGauge: React.FC<RatioGaugeProps> = ({ f, g, className }) => {
  const ratio   = g !== 0 ? f / g : f > 0 ? Infinity : 0;
  const display = isFinite(ratio) ? ratio.toFixed(4) : '∞';
  const pct     = isFinite(ratio) ? clamp(ratio, 0, 1) * 100 : 100;
  const color   = ratioColor(isFinite(ratio) ? ratio : 2);
  const overflow = isFinite(ratio) && ratio >= 1.0;

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Ratio label */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-stone-500 dark:text-stone-400">f/g ratio</span>
        <span
          className="font-mono text-lg font-semibold"
          style={{ color }}
        >
          {display}
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-3 rounded-full bg-black/5 dark:bg-white/8 overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            overflow && 'animate-pulse',
          )}
          style={{
            width: `${pct}%`,
            background: color,
          }}
          aria-hidden
        />
        {/* Ω boundary tick */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-stone-400/60"
          style={{ left: '100%' }}
          aria-hidden
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs font-mono text-stone-400">
        <span>0</span>
        <span className="text-stone-500">Ω boundary</span>
        <span>1</span>
      </div>

      {overflow && (
        <p className="text-xs text-sequoia-finfr font-medium" role="alert">
          Constraint violated — f exceeds capacity g
        </p>
      )}
    </div>
  );
};
