import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, ShieldCheck, Hash, Box, BookOpen,
  Link as ChainIcon, CheckCircle, AlertCircle,
} from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { StatusLight } from '@/components/shared/StatusLight';
import { BezierCanvas } from '@/components/shared/BezierCanvas';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { PageContainer } from '@/components/layout/PageContainer';
import { useHealth } from '@/hooks/useNewton';
import { useLedger } from '@/hooks/useLedger';
import { formatTimestamp } from '@/lib/formatters';

const QUICK_ACTIONS = [
  {
    to:          '/bill',
    icon:        <MessageCircle size={28} />,
    title:       'Ask BILL',
    description: 'Talk to the verified reasoning assistant',
    color:       'text-sequoia-sage',
    bg:          'bg-sequoia-sage/10',
  },
  {
    to:          '/verify',
    icon:        <ShieldCheck size={28} />,
    title:       'Verify',
    description: 'Verify content against Newton constraints',
    color:       'text-sequoia-sky',
    bg:          'bg-sequoia-sky/10',
  },
  {
    to:          '/verify',
    icon:        <Hash size={28} />,
    title:       'Calculate',
    description: 'Verified mathematical computation',
    color:       'text-sequoia-gold',
    bg:          'bg-sequoia-gold/10',
  },
  {
    to:          '/cartridge',
    icon:        <Box size={28} />,
    title:       'Cartridges',
    description: 'Create visual, sound, data, and app blueprints',
    color:       'text-sequoia-clay',
    bg:          'bg-sequoia-clay/10',
  },
  {
    to:          '/education',
    icon:        <BookOpen size={28} />,
    title:       'Education',
    description: 'Lessons, TEKS standards, CMFK diagnostics',
    color:       'text-sequoia-cedar',
    bg:          'bg-sequoia-cedar/10',
  },
  {
    to:          '/ledger',
    icon:        <ChainIcon size={28} />,
    title:       'Ledger',
    description: 'Immutable verified action history',
    color:       'text-sequoia-witness',
    bg:          'bg-sequoia-witness/10',
  },
];

export const HomePage: React.FC = () => {
  const { data: health, isLoading: healthLoading, isError } = useHealth();
  const { data: ledger } = useLedger();

  const lastEntry = ledger?.entries?.[ledger.entries.length - 1];

  return (
    <PageContainer>
      {/* Hero */}
      <div className="mb-8 text-center">
        {/* Bézier canvas hero */}
        <div className="flex justify-center mb-6 opacity-80">
          <BezierCanvas width={340} height={130} animated />
        </div>

        <h1 className="heading-xl mb-2">Newton</h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg font-heading">
          Constraint-first verification engine
        </p>
        <p className="text-sm text-stone-400 mt-1">by Ada Computing Company</p>

        {/* System health indicator */}
        <div className="mt-4 flex justify-center">
          {healthLoading ? (
            <LoadingTrail message="Connecting to Newton…" size="sm" />
          ) : isError ? (
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full">
              <AlertCircle size={14} className="text-sequoia-finfr" />
              <span className="text-sm text-sequoia-finfr">Backend offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full">
              <CheckCircle size={14} className="text-sequoia-fin" />
              <StatusLight result="fin" size="sm" />
              <span className="text-sm text-sequoia-fin">
                All systems admissible · v{health?.version}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.title} to={action.to}>
            <GlassPanel
              padding="md"
              className="h-full hover:brightness-105 active:scale-95 transition-all duration-150 cursor-pointer group"
            >
              <div className={`inline-flex p-2.5 rounded-2xl mb-3 ${action.bg}`}>
                <span className={action.color}>{action.icon}</span>
              </div>
              <h3 className="font-heading font-semibold text-base text-stone-800 dark:text-stone-100 group-hover:text-sequoia-sage transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                {action.description}
              </p>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <GlassPanel padding="md" variant="inset">
          <p className="text-xs text-stone-400">Ledger entries</p>
          <p className="font-mono text-2xl font-bold text-stone-700 dark:text-stone-200 mt-1">
            {ledger?.entries?.length ?? health?.ledger_entries ?? '—'}
          </p>
        </GlassPanel>

        <GlassPanel padding="md" variant="inset">
          <p className="text-xs text-stone-400">Last verification</p>
          <p className="font-mono text-sm font-semibold text-stone-700 dark:text-stone-200 mt-1 truncate">
            {lastEntry ? formatTimestamp(lastEntry.timestamp) : '—'}
          </p>
        </GlassPanel>

        <GlassPanel padding="md" variant="inset" className="col-span-2 sm:col-span-1">
          <p className="text-xs text-stone-400">Newton version</p>
          <p className="font-mono text-2xl font-bold text-sequoia-sage mt-1">
            {health?.version ?? '—'}
          </p>
        </GlassPanel>
      </div>
    </PageContainer>
  );
};
