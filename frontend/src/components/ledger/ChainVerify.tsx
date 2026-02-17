import React from 'react';
import { Link as ChainIcon, CheckCircle, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { useLedgerVerify } from '@/hooks/useLedger';

export const ChainVerify: React.FC = () => {
  const { mutate, data, isPending, error } = useLedgerVerify();

  const valid     = data?.payload?.valid;
  const badStep   = data?.payload?.first_bad_step;
  const entries   = data?.payload?.entries;

  return (
    <GlassPanel
      padding="md"
      status={data ? (valid ? 'fin' : 'finfr') : 'neutral'}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ChainIcon size={20} className="text-sequoia-sky shrink-0" />
          <div>
            <p className="font-medium text-stone-800 dark:text-stone-100">Chain Integrity</p>
            {data && (
              <p className="text-sm text-stone-500">
                {entries} entries verified
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <div className="flex items-center gap-1.5">
              {valid
                ? <>
                    <CheckCircle size={18} className="text-sequoia-fin" />
                    <span className="text-sm text-sequoia-fin font-medium">Chain intact</span>
                  </>
                : <>
                    <XCircle size={18} className="text-sequoia-finfr" />
                    <span className="text-sm text-sequoia-finfr font-medium">
                      Broken at step {badStep ?? '?'}
                    </span>
                  </>
              }
            </div>
          )}
          <Button
            onClick={() => mutate()}
            loading={isPending}
            variant="secondary"
            size="sm"
          >
            Verify Chain
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-sequoia-finfr" role="alert">
          {error instanceof Error ? error.message : 'Chain verification failed'}
        </p>
      )}
    </GlassPanel>
  );
};
