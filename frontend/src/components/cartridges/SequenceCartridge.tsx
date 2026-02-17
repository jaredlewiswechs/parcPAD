import React from 'react';
import { Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { OutputConsole } from '@/components/shared/OutputConsole';
import type { CartridgePayload } from '@/api/newton';

interface SequenceCartridgeProps {
  payload: CartridgePayload;
}

export const SequenceCartridge: React.FC<SequenceCartridgeProps> = ({ payload }) => {
  const steps = (payload.steps ?? payload.sequence ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={22} className="text-sequoia-sky" />
          <h3 className="heading-lg">Sequence Cartridge</h3>
        </div>

        {steps.length > 0 ? (
          <ol className="relative border-l-2 border-sequoia-sage/25 pl-4 space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-sequoia-sage/70 border-2 border-sequoia-sage" />
                <GlassPanel padding="sm" variant="inset">
                  <p className="text-xs text-stone-400 font-mono mb-0.5">Step {i + 1}</p>
                  {typeof step === 'object' ? (
                    <pre className="font-mono text-xs text-stone-700 dark:text-stone-200 whitespace-pre-wrap">
                      {JSON.stringify(step, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-stone-800 dark:text-stone-100">{String(step)}</p>
                  )}
                </GlassPanel>
              </li>
            ))}
          </ol>
        ) : (
          <GlassPanel padding="sm" variant="inset">
            <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-64 whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </GlassPanel>
        )}
      </GlassPanel>

      {Array.isArray(payload['output_log']) && (payload['output_log'] as string[]).length > 0 && (
        <OutputConsole lines={payload['output_log'] as string[]} title="cartridge output" />
      )}
    </div>
  );
};
