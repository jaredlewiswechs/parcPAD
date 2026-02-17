import React, { useEffect, useRef, useState } from 'react';
import { Music, Play, Square } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { OutputConsole } from '@/components/shared/OutputConsole';
import type { CartridgePayload } from '@/api/newton';

interface SoundCartridgeProps {
  payload: CartridgePayload;
}

/** Convert a base64 WAV string to an object URL the browser can play. */
function b64ToObjectUrl(b64: string, mime: string): string {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export const SoundCartridge: React.FC<SoundCartridgeProps> = ({ payload }) => {
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef  = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const b64  = payload['audio_b64']  as string | undefined;
  const mime = (payload['audio_mime'] as string | undefined) ?? 'audio/wav';

  // Create / revoke object URL when b64 changes
  useEffect(() => {
    if (!b64) return;
    const url = b64ToObjectUrl(b64, mime);
    objectUrlRef.current = url;

    const audio = new Audio(url);
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
      audioRef.current = null;
    };
  }, [b64, mime]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const params = [
    { label: 'Waveform',    value: payload['waveform']     },
    { label: 'BPM',         value: payload['tempo_bpm'],  unit: 'BPM' },
    { label: 'Sample Rate', value: payload['sample_rate_hz'], unit: 'Hz' },
    { label: 'Channels',    value: payload['channels']     },
  ];

  const notes = payload['notes'] as Array<{ freq_hz: number; duration_ms: number }> | undefined;
  const outputLog = payload['output_log'] as string[] | undefined;

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Music size={22} className="text-sequoia-gold" />
          <h3 className="heading-lg">Sound Cartridge</h3>
        </div>

        {/* Audio player */}
        {b64 ? (
          <div className="flex items-center gap-4 mb-5 p-4 rounded-xl glass-panel-inset">
            <button
              onClick={togglePlay}
              aria-label={playing ? 'Stop' : 'Play'}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-sequoia-gold text-white hover:brightness-110 transition-all duration-150 flex-shrink-0"
            >
              {playing ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
                {(payload['intent_summary'] as string | undefined) ?? 'Generated audio'}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {payload['waveform'] as string} · {payload['tempo_bpm'] as number} BPM · WAV
              </p>
            </div>
            {/* Native audio controls as fallback */}
            {objectUrlRef.current && (
              <audio
                src={objectUrlRef.current}
                controls
                className="h-9 max-w-[160px] opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Audio controls"
              />
            )}
          </div>
        ) : (
          <p className="text-xs text-stone-400 mb-4">No audio data in spec.</p>
        )}

        {/* Params grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {params.map(({ label, value, unit }) => {
            if (value == null) return null;
            return (
              <GlassPanel key={label} padding="sm" variant="inset">
                <p className="text-xs text-stone-400">{label}</p>
                <p className="font-mono text-base font-semibold text-stone-800 dark:text-stone-100">
                  {String(value)}{unit ? ` ${unit}` : ''}
                </p>
              </GlassPanel>
            );
          })}
        </div>

        {/* Note sequence */}
        {notes && notes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notes.map((n, i) => (
              <GlassPanel key={i} padding="sm" variant="inset" className="text-center min-w-[80px]">
                <p className="text-xs text-stone-400">Note {i + 1}</p>
                <p className="font-mono text-sm font-semibold text-sequoia-gold">{n.freq_hz.toFixed(1)} Hz</p>
                <p className="text-xs text-stone-500">{n.duration_ms} ms</p>
              </GlassPanel>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Python output console */}
      {outputLog && outputLog.length > 0 && (
        <OutputConsole lines={outputLog} title="cartridge output" />
      )}
    </div>
  );
};
