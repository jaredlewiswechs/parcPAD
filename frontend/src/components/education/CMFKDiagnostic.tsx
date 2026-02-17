import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { CMFKShape } from '@/components/shared/CMFKShape';
import { useEducationCmfk } from '@/hooks/useNewton';

export const CMFKDiagnostic: React.FC = () => {
  const [text, setText] = useState('');
  const { mutate, data, isPending, error } = useEducationCmfk();

  const submit = () => {
    if (!text.trim()) return;
    mutate(text.trim());
  };

  const interventions: Record<string, string> = {
    CLEAR:          'Understanding is strong. Introduce extension problems or peer teaching.',
    MISCONCEPTION:  'Address the misconception directly. Use targeted counter-examples.',
    FOG:            'Clarify foundational concepts. Break into smaller steps.',
    OVERCONFIDENT:  'Challenge with edge cases. Encourage epistemic humility.',
    DEVELOPING:     'Provide scaffolding and worked examples. Build confidence gradually.',
  };

  const shape   = data?.payload?.shape ?? '';
  const suggest = interventions[shape] ?? '';

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <Brain size={22} className="text-sequoia-sky" />
          CMFK Cognitive Diagnostic
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter a student response or text to analyze for cognitive clarity…"
          rows={4}
          className="w-full glass-panel-inset p-3 rounded-xl text-base bg-transparent outline-none resize-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 font-ui"
          aria-label="Text to diagnose"
        />

        <div className="flex justify-end mt-3">
          <Button
            onClick={submit}
            loading={isPending}
            disabled={!text.trim()}
            leftIcon={<Brain size={16} />}
          >
            Diagnose
          </Button>
        </div>
      </GlassPanel>

      {error && (
        <div className="bg-sequoia-finfr/10 border border-sequoia-finfr/25 rounded-2xl p-4 text-sm text-sequoia-finfr" role="alert">
          {error instanceof Error ? error.message : 'Diagnosis failed'}
        </div>
      )}

      {data && (
        <div className="space-y-4 animate-slide-up">
          <GlassPanel padding="lg">
            <CMFKShape
              cmfk={data.payload.cmfk}
              shape={data.payload.shape}
              size="lg"
            />
          </GlassPanel>

          {data.payload.steps.length > 0 && (
            <GlassPanel padding="md">
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-2">Diagnostic Steps</p>
              <ol className="space-y-1 list-decimal list-inside">
                {data.payload.steps.map((step, i) => (
                  <li key={i} className="text-sm text-stone-600 dark:text-stone-300">{step}</li>
                ))}
              </ol>
            </GlassPanel>
          )}

          {suggest && (
            <GlassPanel padding="md" status="fin">
              <p className="text-sm font-semibold text-sequoia-sage mb-1">Recommended Intervention</p>
              <p className="text-sm text-stone-600 dark:text-stone-300">{suggest}</p>
            </GlassPanel>
          )}
        </div>
      )}
    </div>
  );
};
