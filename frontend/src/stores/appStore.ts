import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'auto';

interface AppState {
  theme:      Theme;
  apiUrl:     string;
  sidebarOpen: boolean;

  setTheme:       (theme: Theme) => void;
  setApiUrl:      (url: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar:  () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme:       'auto',
      apiUrl:      import.meta.env.VITE_NEWTON_API_URL ?? 'http://localhost:8000',
      sidebarOpen: true,

      setTheme:       (theme)  => set({ theme }),
      setApiUrl:      (apiUrl) => set({ apiUrl }),
      setSidebarOpen: (open)   => set({ sidebarOpen: open }),
      toggleSidebar:  ()       => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'parcpad-settings',
      partialize: (s) => ({ theme: s.theme, apiUrl: s.apiUrl }),
    }
  )
);

/** Apply theme class to <html> element */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // auto: follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
  }
}
