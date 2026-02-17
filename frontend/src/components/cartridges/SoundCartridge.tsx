import React from 'react';
import { Music } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { CartridgePayload } from '@/api/newton';

interface SoundCartridgeProps {
  payload: CartridgePayload;
}

export const SoundCartridge: React.FC<SoundCartridgeProps> = ({ payload }) => {
  const params = [
    { label: 'Frequency',  key: 'frequency',   unit: 'Hz'  },
    { label: 'Duration',   key: 'duration',     unit: 's'   },
    { label: 'Waveform',   key: 'waveform',     unit: ''    },
    { label: 'Amplitude',  key: 'amplitude',    unit: ''    },
    { label: 'Sample Rate',key: 'sample_rate',  unit: 'Hz'  },
    { label: 'Channels',   key: 'channels',     unit: ''    },
    { label: 'BPM',        key: 'bpm',          unit: 'BPM' },
  ];

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Music size={22} className="text-sequoia-gold" />
          <h3 className="heading-lg">Sound Cartridge</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {params.map(({ label, key, unit }) => {
            const val = payload[key];
            if (val == null) return null;
            return (
              <GlassPanel key={key} padding="sm" variant="inset">
                <p className="text-xs text-stone-400">{label}</p>
                <p className="font-mono text-base font-semibold text-stone-800 dark:text-stone-100">
                  {String(val)}{unit && ` ${unit}`}
                </p>
              </GlassPanel>
            );
          })}
        </div>
      </GlassPanel>

      <GlassPanel padding="sm" variant="inset">
        <p className="text-xs text-stone-400 mb-2">Full Spec</p>
        <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-48 whitespace-pre-wrap">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </GlassPanel>
    </div>
  );
};
