import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useHealth } from '@/hooks/useNewton';
import { StatusLight } from '@/components/shared/StatusLight';

export const NavBar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { data: healthData, isError } = useHealth();
  const location = useLocation();

  const pageTitle: Record<string, string> = {
    '/':          'Newton',
    '/bill':      'BILL',
    '/verify':    'Verify',
    '/cartridge': 'Cartridges',
    '/education': 'Education',
    '/ledger':    'Ledger',
    '/settings':  'Settings',
  };

  const title = pageTitle[location.pathname] ?? 'Newton';

  return (
    <header className="glass-panel sticky top-0 z-40 mx-3 mt-3 mb-0 rounded-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: hamburger (mobile/sidebar toggle) + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/8 transition-colors md:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen
              ? <X size={20} className="text-stone-600 dark:text-stone-300" />
              : <Menu size={20} className="text-stone-600 dark:text-stone-300" />
            }
          </button>

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-heading font-bold text-xl text-stone-800 dark:text-stone-100">
              {title}
            </span>
          </Link>
        </div>

        {/* Right: system health */}
        <div className="flex items-center gap-2">
          {isError ? (
            <div className="flex items-center gap-1.5">
              <StatusLight result="finfr" size="sm" />
              <span className="text-xs text-sequoia-finfr hidden sm:block">Offline</span>
            </div>
          ) : healthData ? (
            <div className="flex items-center gap-1.5">
              <StatusLight result="fin" size="sm" />
              <span className="text-xs text-sequoia-fin hidden sm:block">
                v{healthData.version}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <StatusLight result="pending" size="sm" />
              <span className="text-xs text-sequoia-pending hidden sm:block">Connecting…</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
