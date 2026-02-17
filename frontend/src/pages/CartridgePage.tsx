import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { CartridgeRouter } from '@/components/cartridges/CartridgeRouter';

export const CartridgePage: React.FC = () => (
  <PageContainer>
    <h1 className="heading-xl mb-6">Cartridge Workshop</h1>
    <CartridgeRouter />
  </PageContainer>
);
