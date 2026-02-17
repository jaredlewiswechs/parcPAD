import React, { useState } from 'react';
import { Cpu, Zap } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { VisualCartridge }   from './VisualCartridge';
import { SoundCartridge }    from './SoundCartridge';
import { SequenceCartridge } from './SequenceCartridge';
import { DataCartridge }     from './DataCartridge';
import { RosettaCartridge }  from './RosettaCartridge';
import {
  useCartridgeAuto, useCartridgeVisual, useCartridgeSound,
  useCartridgeSequence, useCartridgeData, useCartridgeRosetta,
  useCartridgeInfo,
} from '@/hooks/useNewton';
import type { CartridgePayload, NewtonResponse } from '@/api/newton';
import { clsx } from '@/lib/clsx';

type CartridgeType = 'auto' | 'visual' | 'sound' | 'sequence' | 'data' | 'rosetta';

const TYPE_LABELS: Record<CartridgeType, string> = {
  auto:     'Auto',
  visual:   'Visual',
  sound:    'Sound',
  sequence: 'Sequence',
  data:     'Data',
  rosetta:  'Rosetta',
};

function renderCartridgePayload(type: string, payload: CartridgePayload) {
  const t = type.toLowerCase();
  if (t.includes('visual'))   return <VisualCartridge   payload={payload} />;
  if (t.includes('sound'))    return <SoundCartridge    payload={payload} />;
  if (t.includes('sequence')) return <SequenceCartridge payload={payload} />;
  if (t.includes('data'))     return <DataCartridge     payload={payload} />;
  if (t.includes('rosetta'))  return <RosettaCartridge  payload={payload} />;
  return (
    <GlassPanel padding="sm" variant="inset">
      <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-64 whitespace-pre-wrap">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </GlassPanel>
  );
}

export const CartridgeRouter: React.FC = () => {
  const [intent, setIntent]     = useState('');
  const [cartType, setCartType] = useState<CartridgeType>('auto');
  const [result, setResult]     = useState<NewtonResponse<CartridgePayload> | null>(null);

  const autoMut     = useCartridgeAuto();
  const visualMut   = useCartridgeVisual();
  const soundMut    = useCartridgeSound();
  const seqMut      = useCartridgeSequence();
  const dataMut     = useCartridgeData();
  const rosettaMut  = useCartridgeRosetta();
  const { data: infoData } = useCartridgeInfo();

  const mutMap: Record<CartridgeType, { mutateAsync: (s: string) => Promise<NewtonResponse<CartridgePayload>>; isPending: boolean }> = {
    auto:     autoMut,
    visual:   visualMut,
    sound:    soundMut,
    sequence: seqMut,
    data:     dataMut,
    rosetta:  rosettaMut,
  };

  const active = mutMap[cartType];

  const submit = async () => {
    if (!intent.trim()) return;
    try {
      const res = await active.mutateAsync(intent.trim());
      setResult(res);
    } catch { /* error shown below */ }
  };

  const detectedType = (result?.payload?.type as string | undefined) ?? cartType;

  return (
    <div className="space-y-6">
      {/* Intent input */}
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <Cpu size={22} className="text-sequoia-clay" />
          Cartridge Workshop
        </h2>

        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="Describe what you want to create… e.g. 'a geometric logo', 'relaxing ambient music', 'a lesson sequence on fractions'"
          rows={3}
          className="w-full glass-panel-inset p-3 rounded-xl text-base bg-transparent outline-none resize-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 font-ui"
          aria-label="Cartridge intent"
        />

        {/* Type selector */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(TYPE_LABELS) as CartridgeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setCartType(t)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                cartType === t
                  ? 'bg-sequoia-sage text-white'
                  : 'glass-panel text-stone-600 dark:text-stone-300 hover:brightness-105',
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          {result && (
            <span className="text-sm text-stone-500">
              Detected: <span className="font-mono text-sequoia-clay">{detectedType}</span>
            </span>
          )}
          <Button
            onClick={submit}
            loading={active.isPending}
            disabled={!intent.trim()}
            leftIcon={<Zap size={16} />}
            className="ml-auto"
          >
            Create
          </Button>
        </div>
      </GlassPanel>

      {/* Loading */}
      {active.isPending && (
        <div className="py-8 flex justify-center">
          <LoadingTrail message="Building cartridge…" size="lg" />
        </div>
      )}

      {/* Result */}
      {result && !active.isPending && (
        <div className="space-y-4 animate-slide-up">
          {renderCartridgePayload(detectedType, result.payload)}
          <WitnessCard witness={result.witness} ledgerStep={result.ledger_step} />
        </div>
      )}

      {/* Available cartridges info */}
      {infoData?.cartridges && infoData.cartridges.length > 0 && (
        <GlassPanel padding="md">
          <p className="text-sm font-medium text-stone-500 mb-3">Available Cartridges</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {infoData.cartridges.map((c) => (
              <GlassPanel key={c.name} padding="sm" variant="inset">
                <p className="font-mono text-sm font-semibold text-sequoia-clay">{c.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">{c.description}</p>
              </GlassPanel>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
