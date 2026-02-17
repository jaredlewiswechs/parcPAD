import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from '@/lib/clsx';

interface LedgerBadgeProps {
  step?:      number | null;
  className?: string;
  asLink?:    boolean;
}

export const LedgerBadge: React.FC<LedgerBadgeProps> = ({ step, className, asLink }) => {
  if (step == null) return null;

  const content = (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg',
        'font-mono text-xs font-medium',
        'bg-sequoia-sky/15 text-sequoia-sky border border-sequoia-sky/25',
        className,
      )}
    >
      <span className="opacity-60">Step</span>
      <span>{step}</span>
    </span>
  );

  if (asLink) {
    return <Link to="/ledger" className="hover:opacity-80 transition-opacity">{content}</Link>;
  }

  return content;
};
