import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ChainVerify } from '@/components/ledger/ChainVerify';
import { LedgerExplorer } from '@/components/ledger/LedgerExplorer';

export const LedgerPage: React.FC = () => (
  <PageContainer>
    <h1 className="heading-xl mb-6">Record Office</h1>
    <div className="space-y-4">
      <ChainVerify />
      <LedgerExplorer />
    </div>
  </PageContainer>
);
