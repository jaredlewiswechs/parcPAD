import React from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { CartridgePayload } from '@/api/newton';

interface VisualCartridgeProps {
  payload: CartridgePayload;
}

export const VisualCartridge: React.FC<VisualCartridgeProps> = ({ payload }) => {
  const svgContent = payload.svg as string | undefined;
  const spec = payload.spec as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      {svgContent ? (
        <GlassPanel padding="md" className="flex justify-center overflow-hidden">
          <div
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </GlassPanel>
      ) : (
        <GlassPanel padding="md">
          <p className="text-sm text-stone-400 text-center">
            Visual cartridge generated — no inline SVG preview available.
          </p>
        </GlassPanel>
      )}

      {spec && (
        <GlassPanel padding="sm" variant="inset">
          <p className="text-xs text-stone-400 mb-2">Spec</p>
          <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </GlassPanel>
      )}

      {!svgContent && !spec && (
        <GlassPanel padding="sm" variant="inset">
          <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-64 whitespace-pre-wrap">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </GlassPanel>
      )}
    </div>
  );
};
