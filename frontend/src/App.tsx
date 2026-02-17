import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { HomePage }      from '@/pages/HomePage';
import { BillPage }      from '@/pages/BillPage';
import { VerifyPage }    from '@/pages/VerifyPage';
import { CartridgePage } from '@/pages/CartridgePage';
import { EducationPage } from '@/pages/EducationPage';
import { LedgerPage }    from '@/pages/LedgerPage';
import { SettingsPage }  from '@/pages/SettingsPage';
import { useAppStore, applyTheme } from '@/stores/appStore';

export const App: React.FC = () => {
  const { theme } = useAppStore();

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    // Also listen for OS preference changes when in 'auto' mode
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Shell />}>
        <Route index            element={<HomePage />}      />
        <Route path="bill"      element={<BillPage />}      />
        <Route path="verify"    element={<VerifyPage />}    />
        <Route path="cartridge" element={<CartridgePage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="ledger"    element={<LedgerPage />}    />
        <Route path="settings"  element={<SettingsPage />}  />
      </Route>
    </Routes>
  );
};
