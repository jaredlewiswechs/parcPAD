import React from 'react';
import type { NewtonResult } from '@/lib/colors';
import { resultLabel } from '@/lib/colors';
import { clsx } from '@/lib/clsx';

interface StatusLightProps {
  result:     NewtonResult | string;
  showLabel?: boolean;
  size?:      'sm' | 'md' | 'lg';
  className?: string;
}

const dotClass: Record<string, string> = {
  fin:     'status-fin',
  finfr:   'status-finfr',
  pending: 'status-pending',
};

const sizeMap = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
};

const labelColor: Record<string, string> = {
  fin:     'text-sequoia-fin',
  finfr:   'text-sequoia-finfr',
  pending: 'text-sequoia-pending',
};

export const StatusLight: React.FC<StatusLightProps> = ({
  result,
  showLabel = false,
  size      = 'md',
  className,
}) => {
  const key    = result in dotClass ? result : 'pending';
  const label  = (resultLabel as Record<string, string>)[key] ?? result;

  return (
    <span
      className={clsx('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={label}
    >
      <span
        className={clsx(dotClass[key] ?? 'status-pending', sizeMap[size])}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={clsx('text-sm font-medium', labelColor[key] ?? 'text-sequoia-pending')}>
          {label}
        </span>
      )}
    </span>
  );
};
