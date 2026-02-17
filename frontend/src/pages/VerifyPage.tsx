import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { VerifyPanel } from '@/components/verify/VerifyPanel';
import { Calculator } from '@/components/calculate/Calculator';
import { ConstraintPanel } from '@/components/constraint/ConstraintPanel';
import { VaultPanel } from '@/components/vault/VaultPanel';
import { clsx } from '@/lib/clsx';

type Tab = 'verify' | 'calculate' | 'constraint' | 'vault';

const TABS: { id: Tab; label: string }[] = [
  { id: 'verify',     label: 'Verify'      },
  { id: 'calculate',  label: 'Calculate'   },
  { id: 'constraint', label: 'Constraint'  },
  { id: 'vault',      label: 'Vault'       },
];

export const VerifyPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('verify');

  return (
    <PageContainer>
      <h1 className="heading-xl mb-6">Verification Tools</h1>

      {/* Tab strip */}
      <div className="flex gap-2 mb-6 glass-panel p-1.5 rounded-2xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
              tab === t.id
                ? 'bg-sequoia-sage text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/8',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'verify'     && <VerifyPanel />}
      {tab === 'calculate'  && <Calculator />}
      {tab === 'constraint' && <ConstraintPanel />}
      {tab === 'vault'      && <VaultPanel />}
    </PageContainer>
  );
};
