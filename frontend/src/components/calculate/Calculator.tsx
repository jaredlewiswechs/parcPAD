import React, { useState } from 'react';
import { Hash } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { StatusLight } from '@/components/shared/StatusLight';
import { ExampleList } from './ExampleList';
import { useCalculate } from '@/hooks/useNewton';
import { formatNumber } from '@/lib/formatters';

export const Calculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const { mutate, data, isPending, error } = useCalculate();

  const submit = () => {
    if (!expression.trim()) return;
    mutate(expression.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <Hash size={22} className="text-sequoia-sage" />
          Verified Calculator
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. sqrt(144) + pi * 5^2"
            className="flex-1 glass-panel-inset px-4 py-3 rounded-xl font-mono text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            aria-label="Mathematical expression"
          />
          <Button onClick={submit} loading={isPending} disabled={!expression.trim()}>
            =
          </Button>
        </div>

        <p className="mt-2 text-xs text-stone-400">
          Supports: +, -, *, /, ^, sqrt, sin, cos, tan, log, floor, ceil, pi, e
        </p>

        <div className="mt-4">
          <ExampleList onSelect={(ex) => { setExpression(ex); mutate(ex); }} />
        </div>
      </GlassPanel>

      {error && (
        <div className="bg-sequoia-finfr/10 border border-sequoia-finfr/25 rounded-2xl p-4 text-sm text-sequoia-finfr" role="alert">
          {error instanceof Error ? error.message : 'Calculation error'}
        </div>
      )}

      {data && (
        <GlassPanel status={data.result} padding="lg" className="animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <StatusLight result={data.result} showLabel size="md" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-stone-500">{data.payload.expression}</span>
            <span className="font-mono text-3xl font-bold text-sequoia-sage">
              = {formatNumber(data.payload.result)}
            </span>
          </div>
          <div className="mt-4">
            <WitnessCard witness={data.witness} ledgerStep={data.ledger_step} />
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
