import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { TabBar } from './TabBar';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/appStore';

export const Shell: React.FC = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar */}
      <NavBar />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 gap-3 px-3 pt-3 pb-24 md:pb-6">
        {/* Desktop sidebar */}
        <Sidebar open={sidebarOpen} />

        {/* Page content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <TabBar />
    </div>
  );
};
