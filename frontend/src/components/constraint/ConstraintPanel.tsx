import React, { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { RatioGauge } from '@/components/shared/RatioGauge';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { StatusLight } from '@/components/shared/StatusLight';
import { useConstraint } from '@/hooks/useNewton';

export const ConstraintPanel: React.FC = () => {
  const [f, setF] = useState('');
  const [g, setG] = useState('');
  const [name, setName] = useState('');
  const { mutate, data, isPending, error } = useConstraint();

  const submit = () => {
    const fNum = parseFloat(f);
    const gNum = parseFloat(g);
    if (isNaN(fNum) || isNaN(gNum)) return;
    mutate({ f: fNum, g: gNum, name: name || undefined });
  };

  const fNum = parseFloat(f);
  const gNum = parseFloat(g);
  const hasValues = !isNaN(fNum) && !isNaN(gNum);

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <GitMerge size={22} className="text-sequoia-sage" />
          Constraint Checker
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-stone-500 mb-1">f (demand)</label>
            <input
              type="number"
              value={f}
              onChange={(e) => setF(e.target.value)}
              placeholder="e.g. 0.75"
              className="w-full glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              aria-label="Demand value f"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-500 mb-1">g (capacity)</label>
            <input
              type="number"
              value={g}
              onChange={(e) => setG(e.target.value)}
              placeholder="e.g. 1.0"
              className="w-full glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              aria-label="Capacity value g"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-500 mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="constraint-name"
              className="w-full glass-panel-inset px-3 py-2.5 rounded-xl text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              aria-label="Constraint name"
            />
          </div>
        </div>

        {/* Live ratio preview */}
        {hasValues && (
          <div className="mt-4">
            <RatioGauge f={fNum} g={gNum} />
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={submit} loading={isPending} disabled={!hasValues}>
            Check Constraint
          </Button>
        </div>
      </GlassPanel>

      {error && (
        <div className="bg-sequoia-finfr/10 border border-sequoia-finfr/25 rounded-2xl p-4 text-sm text-sequoia-finfr" role="alert">
          {error instanceof Error ? error.message : 'Constraint check failed'}
        </div>
      )}

      {data && (
        <GlassPanel status={data.result} padding="lg" className="animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <StatusLight result={data.result} showLabel size="md" />
          </div>
          <RatioGauge f={data.payload.f} g={data.payload.g} />
          <div className="mt-4">
            <WitnessCard witness={data.witness} />
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
