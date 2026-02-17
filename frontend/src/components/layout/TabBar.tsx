import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, ShieldCheck, Box, BookOpen } from 'lucide-react';
import { clsx } from '@/lib/clsx';

const TABS = [
  { to: '/',          icon: <Home size={22} />,          label: 'Home'   },
  { to: '/bill',      icon: <MessageCircle size={22} />,  label: 'BILL'   },
  { to: '/verify',    icon: <ShieldCheck size={22} />,    label: 'Verify' },
  { to: '/cartridge', icon: <Box size={22} />,            label: 'Create' },
  { to: '/education', icon: <BookOpen size={22} />,       label: 'Learn'  },
];

export const TabBar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > lastY.current && y > 60);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        'md:hidden fixed bottom-3 left-3 right-3 z-50',
        'glass-panel px-2 py-2',
        'tab-bar',
        scrolled && 'scrolled',
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl',
              'transition-all duration-150 min-w-[52px]',
              isActive
                ? 'text-sequoia-sage bg-sequoia-sage/12'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200',
            )}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
