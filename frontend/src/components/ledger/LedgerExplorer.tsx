import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { StatusLight } from '@/components/shared/StatusLight';
import { useLedger } from '@/hooks/useLedger';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { formatTimestamp, truncateHash, truncateText } from '@/lib/formatters';
import type { LedgerEntry, NewtonResult } from '@/api/newton';
import { clsx } from '@/lib/clsx';

const PAGE_SIZE = 20;

function EntryCard({ entry }: { entry: LedgerEntry }) {
  const [open, setOpen] = useState(false);
  const result = (entry.result ?? 'fin') as NewtonResult;

  return (
    <GlassPanel padding="sm" status={result} className="animate-fade-in">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setOpen(!open)}
        role="button"
        aria-expanded={open}
        aria-label={`Ledger step ${entry.step}`}
      >
        <span className="font-mono text-lg font-bold text-stone-500 w-10 shrink-0">
          #{entry.step}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
            {entry.intent}
          </p>
          <p className="text-xs text-stone-400 font-mono">
            {truncateHash(entry.entry_hash, 12)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusLight result={result} size="sm" />
          <span className="text-xs text-stone-400 hidden sm:block">
            {formatTimestamp(entry.timestamp)}
          </span>
          {open
            ? <ChevronUp size={14} className="text-stone-400" />
            : <ChevronDown size={14} className="text-stone-400" />
          }
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 space-y-1 text-xs font-mono">
          <div className="flex gap-2">
            <span className="text-stone-400 w-28 shrink-0">Intent</span>
            <span className="text-stone-600 dark:text-stone-300">{entry.intent}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-stone-400 w-28 shrink-0">Timestamp</span>
            <span className="text-stone-600 dark:text-stone-300">{formatTimestamp(entry.timestamp)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-stone-400 w-28 shrink-0">Entry hash</span>
            <span className="text-stone-600 dark:text-stone-300 break-all">{entry.entry_hash}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-stone-400 w-28 shrink-0">Prev hash</span>
            <span className="text-stone-600 dark:text-stone-300 break-all">{entry.prev_hash}</span>
          </div>
          {entry.payload_hash && (
            <div className="flex gap-2">
              <span className="text-stone-400 w-28 shrink-0">Payload hash</span>
              <span className="text-stone-600 dark:text-stone-300 break-all">{entry.payload_hash}</span>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}

export const LedgerExplorer: React.FC = () => {
  const { data, isLoading, error } = useLedger();
  const [filter,  setFilter]  = useState<'all' | 'fin' | 'finfr'>('all');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);

  if (isLoading) return <LoadingTrail message="Loading ledger…" size="lg" />;
  if (error)     return (
    <div className="text-sm text-sequoia-finfr" role="alert">
      {error instanceof Error ? error.message : 'Failed to load ledger'}
    </div>
  );

  const entries = data?.entries ?? [];

  const filtered = entries.filter((e) => {
    if (filter === 'fin'   && e.result !== 'fin')   return false;
    if (filter === 'finfr' && e.result !== 'finfr') return false;
    if (search && !e.intent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).reverse(); // newest first

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by intent…"
          className="flex-1 glass-panel-inset px-3 py-2.5 rounded-xl bg-transparent outline-none text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
          aria-label="Search ledger entries"
        />
        <div className="flex gap-1">
          {(['all', 'fin', 'finfr'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={clsx(
                'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                filter === f
                  ? 'bg-sequoia-sage text-white'
                  : 'glass-panel text-stone-600 dark:text-stone-300 hover:brightness-105',
              )}
            >
              {f === 'all' ? 'All' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-stone-400">
        {filtered.length} entries{entries.length !== filtered.length && ` (of ${entries.length} total)`}
      </p>

      {/* Entries */}
      <div className="space-y-2">
        {paged.map((entry) => (
          <EntryCard key={`${entry.step}-${entry.entry_hash}`} entry={entry} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-xl glass-panel text-sm disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-stone-500">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-xl glass-panel text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {paged.length === 0 && (
        <p className="text-center text-stone-400 py-8">No entries match your filter.</p>
      )}
    </div>
  );
};
