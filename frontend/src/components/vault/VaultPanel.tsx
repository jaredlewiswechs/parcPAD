import React, { useState } from 'react';
import { Archive, Search } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { WitnessCard } from '@/components/shared/WitnessCard';
import { StatusLight } from '@/components/shared/StatusLight';
import { useVaultStore, useVaultRetrieve } from '@/hooks/useNewton';

export const VaultPanel: React.FC = () => {
  const [key, setKey]     = useState('');
  const [value, setValue] = useState('');
  const [retKey, setRetKey] = useState('');

  const storeMut   = useVaultStore();
  const retMut     = useVaultRetrieve();

  const handleStore = () => {
    if (!key.trim() || !value.trim()) return;
    let parsed: unknown = value;
    try { parsed = JSON.parse(value); } catch { /* string value */ }
    storeMut.mutate({ key: key.trim(), value: parsed });
  };

  const handleRetrieve = () => {
    if (!retKey.trim()) return;
    retMut.mutate(retKey.trim());
  };

  return (
    <div className="space-y-6">
      {/* Store */}
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <Archive size={22} className="text-sequoia-sage" />
          Vault Store
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key"
            className="w-full glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            aria-label="Vault key"
          />
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Value (JSON or plain text, e.g. {"count": 42} or "hello")'
            rows={3}
            className="w-full glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-sm bg-transparent outline-none resize-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            aria-label="Vault value"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleStore}
              loading={storeMut.isPending}
              disabled={!key.trim() || !value.trim()}
            >
              Store
            </Button>
          </div>
        </div>

        {storeMut.data && (
          <div className="mt-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <StatusLight result={storeMut.data.result} showLabel size="sm" />
              <span className="text-sm text-stone-500">
                Stored key: <code className="font-mono text-sequoia-sage">{storeMut.data.payload.key}</code>
              </span>
            </div>
            <WitnessCard witness={storeMut.data.witness} ledgerStep={storeMut.data.ledger_step} />
          </div>
        )}

        {storeMut.error && (
          <p className="mt-3 text-sm text-sequoia-finfr" role="alert">
            {storeMut.error instanceof Error ? storeMut.error.message : 'Store failed'}
          </p>
        )}
      </GlassPanel>

      {/* Retrieve */}
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <Search size={22} className="text-sequoia-sky" />
          Vault Retrieve
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={retKey}
            onChange={(e) => setRetKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
            placeholder="Key to retrieve"
            className="flex-1 glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-base bg-transparent outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
            aria-label="Key to retrieve"
          />
          <Button
            onClick={handleRetrieve}
            loading={retMut.isPending}
            disabled={!retKey.trim()}
            leftIcon={<Search size={16} />}
          >
            Retrieve
          </Button>
        </div>

        {retMut.data && (
          <GlassPanel status={retMut.data.result} padding="md" className="mt-4 animate-slide-up">
            <p className="text-sm text-stone-500 mb-1">
              <span className="font-mono text-sequoia-sage">{retMut.data.payload.key}</span>
            </p>
            <pre className="font-mono text-sm text-stone-800 dark:text-stone-100 overflow-auto max-h-40 whitespace-pre-wrap">
              {JSON.stringify(retMut.data.payload.value, null, 2)}
            </pre>
          </GlassPanel>
        )}

        {retMut.error && (
          <p className="mt-3 text-sm text-sequoia-finfr" role="alert">
            {retMut.error instanceof Error ? retMut.error.message : 'Retrieve failed'}
          </p>
        )}
      </GlassPanel>
    </div>
  );
};
