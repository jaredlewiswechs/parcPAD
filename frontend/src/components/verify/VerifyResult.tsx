import React from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { StatusLight } from '@/components/shared/StatusLight';
import { WitnessCard } from '@/components/shared/WitnessCard';
import type { NewtonResponse, VerifyPayload } from '@/api/newton';
import { resultLabel } from '@/lib/colors';

interface VerifyResultProps {
  response: NewtonResponse<VerifyPayload>;
}

export const VerifyResult: React.FC<VerifyResultProps> = ({ response }) => {
  const label = resultLabel[response.result] ?? response.result;

  return (
    <div className="space-y-4 animate-slide-up">
      <GlassPanel status={response.result} padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <StatusLight result={response.result} size="lg" />
          <h3 className="heading-lg">{label}</h3>
        </div>

        <p className="text-stone-600 dark:text-stone-300 text-sm">
          Content verified through Newton v2.0 constraint engine.
        </p>

        {response.witness.violations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-sequoia-finfr">Violations</p>
            {response.witness.violations.map((v, i) => (
              <div key={i} className="bg-sequoia-finfr/10 border border-sequoia-finfr/20 rounded-xl px-3 py-2 text-sm">
                <span className="font-mono text-sequoia-finfr">{v.constraint}</span>
                {v.value != null && <span className="ml-1 text-stone-500">= {v.value}</span>}
                {v.description && <p className="text-stone-600 dark:text-stone-300 mt-0.5">{v.description}</p>}
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <WitnessCard witness={response.witness} defaultOpen />
    </div>
  );
};
