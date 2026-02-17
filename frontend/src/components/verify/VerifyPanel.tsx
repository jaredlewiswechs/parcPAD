import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { VerifyResult } from './VerifyResult';
import { useVerify } from '@/hooks/useNewton';

export const VerifyPanel: React.FC = () => {
  const [content, setContent] = useState('');
  const { mutate, data, isPending, error } = useVerify();

  const submit = () => {
    if (!content.trim()) return;
    mutate({ content: content.trim() });
  };

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <h2 className="heading-lg mb-4 flex items-center gap-2">
          <ShieldCheck size={22} className="text-sequoia-sage" />
          Verify Content
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter content to verify against Newton constraints…"
          rows={5}
          className="glass-panel-inset w-full p-3 rounded-xl text-base bg-transparent outline-none resize-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 font-ui"
          aria-label="Content to verify"
        />

        <div className="flex justify-end mt-3">
          <Button
            onClick={submit}
            loading={isPending}
            disabled={!content.trim()}
            leftIcon={<ShieldCheck size={16} />}
          >
            Verify
          </Button>
        </div>
      </GlassPanel>

      {error && (
        <div className="bg-sequoia-finfr/10 border border-sequoia-finfr/25 rounded-2xl p-4 text-sm text-sequoia-finfr" role="alert">
          {error instanceof Error ? error.message : 'Verification failed'}
        </div>
      )}

      {data && <VerifyResult response={data} />}
    </div>
  );
};
