import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, MessageCircle, ShieldCheck, Box, BookOpen,
  Link as ChainIcon, Settings,
} from 'lucide-react';
import { clsx } from '@/lib/clsx';

interface NavItem {
  to:    string;
  icon:  React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',          icon: <Home size={18} />,          label: 'Home'       },
  { to: '/bill',      icon: <MessageCircle size={18} />,  label: 'BILL'       },
  { to: '/verify',    icon: <ShieldCheck size={18} />,    label: 'Verify'     },
  { to: '/cartridge', icon: <Box size={18} />,            label: 'Cartridges' },
  { to: '/education', icon: <BookOpen size={18} />,       label: 'Education'  },
  { to: '/ledger',    icon: <ChainIcon size={18} />,      label: 'Ledger'     },
  { to: '/settings',  icon: <Settings size={18} />,       label: 'Settings'   },
];

interface SidebarProps {
  open: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  if (!open) return null;

  return (
    <aside
      className={clsx(
        'glass-panel w-56 shrink-0 hidden md:flex flex-col gap-1 p-3',
        'sticky top-[76px] self-start h-[calc(100vh-92px)] overflow-y-auto',
      )}
    >
      <div className="px-2 pb-2 border-b border-black/5 dark:border-white/5 mb-1">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Navigation</p>
      </div>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
            'transition-all duration-150',
            isActive
              ? 'bg-sequoia-sage/15 text-sequoia-sage'
              : 'text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/8',
          )}
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}

      <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5">
        <p className="text-xs text-stone-400 text-center font-mono">
          Ada Computing Company
        </p>
      </div>
    </aside>
  );
};
