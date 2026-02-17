import React from 'react';
import { BillShell } from '@/components/bill/BillShell';
import { PageContainer } from '@/components/layout/PageContainer';

export const BillPage: React.FC = () => (
  <PageContainer maxWidth="lg">
    <BillShell />
  </PageContainer>
);
