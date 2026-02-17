import React from 'react';
import { Code2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { CartridgePayload } from '@/api/newton';

interface RosettaCartridgeProps {
  payload: CartridgePayload;
}

export const RosettaCartridge: React.FC<RosettaCartridgeProps> = ({ payload }) => {
  const blueprint = (payload.blueprint ?? payload.code ?? payload.app ?? payload) as unknown;
  const blueprintStr = typeof blueprint === 'string'
    ? blueprint
    : JSON.stringify(blueprint, null, 2);

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Code2 size={22} className="text-sequoia-clay" />
          <h3 className="heading-lg">Rosetta Cartridge</h3>
          <span className="text-sm text-stone-400">App Blueprint</span>
        </div>

        <div className="glass-panel-inset rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-black/5 dark:border-white/5">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <span className="text-xs font-mono text-stone-400">blueprint.json</span>
          </div>
          <pre className="font-mono text-sm text-stone-700 dark:text-stone-200 p-4 overflow-auto max-h-80 whitespace-pre-wrap leading-relaxed">
            {blueprintStr}
          </pre>
        </div>
      </GlassPanel>
    </div>
  );
};
