import React, { useState } from 'react';
import { Cpu, Zap, MessageSquare } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { OutputConsole } from '@/components/shared/OutputConsole';
import { VisualCartridge }   from './VisualCartridge';
import { SoundCartridge }    from './SoundCartridge';
import { SequenceCartridge } from './SequenceCartridge';
import { DataCartridge }     from './DataCartridge';
import { RosettaCartridge }  from './RosettaCartridge';
import {
  useCartridgeAuto, useCartridgeVisual, useCartridgeSound,
  useCartridgeSequence, useCartridgeData, useCartridgeRosetta,
  useCartridgeInfo, useVerify,
} from '@/hooks/useNewton';
import { puterChat, buildCartridgePrompt, extractSvg } from '@/api/puter';
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

/** Route to the right renderer based on type string in payload. */
function renderCartridgePayload(type: string, payload: CartridgePayload) {
  const t = type.toLowerCase();
  if (t.includes('visual'))   return <VisualCartridge   payload={payload} />;
  if (t.includes('sound'))    return <SoundCartridge    payload={payload} />;
  if (t.includes('sequence')) return <SequenceCartridge payload={payload} />;
  if (t.includes('data'))     return <DataCartridge     payload={payload} />;
  if (t.includes('rosetta'))  return <RosettaCartridge  payload={payload} />;
  // Agnostic fallback — show output_log if present, else raw JSON
  const outputLog = payload['output_log'] as string[] | undefined;
  return (
    <div className="space-y-3">
      {outputLog && outputLog.length > 0 && (
        <OutputConsole lines={outputLog} title="cartridge output" />
      )}
      <GlassPanel padding="sm" variant="inset">
        <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-64 whitespace-pre-wrap">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </GlassPanel>
    </div>
  );
}

/**
 * Merge puter-generated content into a cartridge payload.
 * Uses payload.type (set by backend) so auto-routed cartridges merge correctly.
 */
function mergeCartridgePuterContent(
  _cartType: CartridgeType,
  payload: CartridgePayload,
  puterContent: string,
): CartridgePayload {
  const effectiveType = (payload['type'] as string | undefined) ?? _cartType;
  if (effectiveType === 'visual') {
    const svg = extractSvg(puterContent);
    if (svg) return { ...payload, svg };
  }
  if (effectiveType === 'rosetta') {
    return { ...payload, code: puterContent };
  }
  // sound, sequence, data — attach as a Newton-verified description
  return { ...payload, puter_content: puterContent };
}

export const CartridgeRouter: React.FC = () => {
  const [intent, setIntent]             = useState('');
  const [cartType, setCartType]         = useState<CartridgeType>('auto');
  const [result, setResult]             = useState<NewtonResponse<CartridgePayload> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg]     = useState<string>('Building cartridge…');

  const autoMut    = useCartridgeAuto();
  const visualMut  = useCartridgeVisual();
  const soundMut   = useCartridgeSound();
  const seqMut     = useCartridgeSequence();
  const dataMut    = useCartridgeData();
  const rosettaMut = useCartridgeRosetta();
  const verifyMut  = useVerify();
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
    if (!intent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      // ── Step 1: Newton generates cartridge spec ───────────────────────────
      setLoadingMsg('Newton building cartridge spec…');
      const res = await active.mutateAsync(intent.trim());

      // ── Step 2: puter.js augments with LLM content ────────────────────────
      let finalRes = res;
      if (typeof puter !== 'undefined') {
        try {
          setLoadingMsg('Ada generating content via LLM…');
          const specPayload = res.payload as Record<string, unknown>;
          // Use payload.type (set by backend) so auto routes to the right prompt
          const effectiveType =
            (specPayload['type'] as CartridgeType | undefined) ?? cartType;
          const prompt = buildCartridgePrompt(effectiveType, intent.trim(), specPayload);
          const puterContent = await puterChat(prompt);

          // ── Step 3: Newton gates the LLM output ────────────────────────────
          setLoadingMsg('Newton verifying LLM content…');
          const verifyRes = await verifyMut.mutateAsync({ content: puterContent });

          if (verifyRes.result === 'fin') {
            finalRes = {
              ...res,
              payload: mergeCartridgePuterContent(cartType, res.payload, puterContent),
              witness: verifyRes.witness,
              result:  'fin',
            };
          }
          // finfr: Newton gates the content — fall back to Newton spec only
        } catch {
          // puter.js unavailable — show Newton spec as-is
        }
      }

      setResult(finalRes);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create cartridge — is Newton running?',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // payload.type is set by the backend; fall back to user-selected tab
  const detectedType =
    (result?.payload?.['type'] as string | undefined) ?? cartType;

  // LLM description (sound / sequence / data)
  const puterContent = result?.payload?.['puter_content'] as string | undefined;

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
            loading={isSubmitting}
            disabled={!intent.trim() || isSubmitting}
            leftIcon={<Zap size={16} />}
            className="ml-auto"
          >
            Create
          </Button>
        </div>
      </GlassPanel>

      {/* Loading */}
      {isSubmitting && (
        <div className="py-8 flex justify-center">
          <LoadingTrail message={loadingMsg} size="lg" />
        </div>
      )}

      {/* Error */}
      {submitError && !isSubmitting && (
        <GlassPanel padding="md" status="finfr">
          <p className="text-sm text-sequoia-finfr font-medium">Error</p>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{submitError}</p>
        </GlassPanel>
      )}

      {/* ── Output ──────────────────────────────────────────────────────── */}
      {result && !isSubmitting && (
        <div className="space-y-4 animate-slide-up">

          {/* Main output — audio player / chart / SVG / etc. */}
          {renderCartridgePayload(detectedType, result.payload)}

          {/* Ada / LLM content — only shown when Newton passes it */}
          {puterContent && (
            <GlassPanel padding="md">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-sequoia-sky" />
                <p className="text-xs font-mono text-stone-400">ada · llm output · newton verified</p>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                {puterContent}
              </p>
            </GlassPanel>
          )}

          <WitnessCard witness={result.witness} ledgerStep={result.ledger_step} />
        </div>
      )}

      {/* Available cartridges */}
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
