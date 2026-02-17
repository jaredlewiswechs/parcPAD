import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { StatusLight } from './StatusLight';
import { LedgerBadge } from './LedgerBadge';
import type { Witness, NewtonResult } from '@/api/newton';
import { truncateHash, formatTimestamp } from '@/lib/formatters';
import { clsx } from '@/lib/clsx';

interface WitnessCardProps {
  witness:      Witness;
  ledgerStep?:  number | null;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?:   string;
}

export const WitnessCard: React.FC<WitnessCardProps> = ({
  witness,
  ledgerStep,
  collapsible = true,
  defaultOpen = false,
  className,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const result = (witness.result ?? 'pending') as NewtonResult;

  return (
    <GlassPanel
      variant="inset"
      padding="sm"
      status={result}
      className={clsx('text-sm', className)}
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-sequoia-sky shrink-0" aria-hidden />
          <StatusLight result={result} showLabel size="sm" />
          <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
            {truncateHash(witness.state_hash, 10)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ledgerStep != null && <LedgerBadge step={ledgerStep} asLink />}
          {collapsible && (
            <button
              onClick={() => setOpen(!open)}
              className="p-0.5 hover:opacity-70 transition-opacity"
              aria-label={open ? 'Collapse witness' : 'Expand witness'}
            >
              {open
                ? <ChevronUp size={14} className="text-stone-400" />
                : <ChevronDown size={14} className="text-stone-400" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {(!collapsible || open) && (
        <div className="mt-3 space-y-2 border-t border-black/5 dark:border-white/5 pt-2">
          {witness.timestamp != null && witness.timestamp > 0 && (
            <div className="flex gap-2">
              <span className="text-stone-400 w-28 shrink-0">Timestamp</span>
              <span className="font-mono text-xs text-stone-600 dark:text-stone-300">
                {formatTimestamp(witness.timestamp)}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <span className="text-stone-400 w-28 shrink-0">Hash</span>
            <span className="font-mono text-xs text-stone-600 dark:text-stone-300 break-all">
              {witness.state_hash}
            </span>
          </div>

          {witness.curve_samples != null && (
            <div className="flex gap-2">
              <span className="text-stone-400 w-28 shrink-0">Curve samples</span>
              <span className="text-stone-600 dark:text-stone-300">{witness.curve_samples}</span>
            </div>
          )}

          {witness.violations.length > 0 && (
            <div>
              <p className="text-stone-400 mb-1">Violations</p>
              <ul className="space-y-1">
                {witness.violations.map((v, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 bg-sequoia-finfr/10 rounded-lg px-2 py-1"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-sequoia-finfr mt-1 shrink-0" aria-hidden />
                    <div>
                      <span className="font-mono text-xs text-sequoia-finfr">{v.constraint}</span>
                      {v.value != null && (
                        <span className="ml-1 text-xs text-stone-500">({v.value})</span>
                      )}
                      {v.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{v.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
};
