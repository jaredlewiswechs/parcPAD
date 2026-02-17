import React from 'react';
import { Settings } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import { useAppStore, applyTheme } from '@/stores/appStore';
import { clsx } from '@/lib/clsx';

type Theme = 'light' | 'dark' | 'auto';

export const SettingsPage: React.FC = () => {
  const { theme, apiUrl, setTheme, setApiUrl } = useAppStore();
  const [localUrl, setLocalUrl] = React.useState(apiUrl);

  const handleTheme = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  const handleSaveUrl = () => {
    setApiUrl(localUrl.trim());
    window.location.reload();
  };

  const THEME_OPTIONS: { id: Theme; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark',  label: 'Dark'  },
    { id: 'auto',  label: 'Auto'  },
  ];

  return (
    <PageContainer maxWidth="md">
      <h1 className="heading-xl mb-6 flex items-center gap-3">
        <Settings size={30} className="text-sequoia-sage" />
        Settings
      </h1>

      <div className="space-y-6">
        {/* API URL */}
        <GlassPanel padding="lg">
          <h2 className="heading-lg mb-4">API Configuration</h2>
          <label className="block text-sm text-stone-500 mb-2">Newton API URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              className="flex-1 glass-panel-inset px-3 py-2.5 rounded-xl font-mono text-sm bg-transparent outline-none text-stone-800 dark:text-stone-100"
              aria-label="Newton API URL"
            />
            <Button onClick={handleSaveUrl} disabled={localUrl.trim() === apiUrl} size="sm">
              Save & Reload
            </Button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Current: <code className="font-mono">{apiUrl}</code>
          </p>
        </GlassPanel>

        {/* Theme */}
        <GlassPanel padding="lg">
          <h2 className="heading-lg mb-4">Appearance</h2>
          <label className="block text-sm text-stone-500 mb-3">Theme</label>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  theme === t.id
                    ? 'bg-sequoia-sage text-white'
                    : 'glass-panel text-stone-600 dark:text-stone-300 hover:brightness-105',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* About */}
        <GlassPanel padding="lg" variant="inset">
          <h2 className="heading-lg mb-3">About</h2>
          <div className="space-y-1 text-sm text-stone-500">
            <p><span className="font-medium text-stone-700 dark:text-stone-200">parcPAD</span> — Newton v2.0 Frontend</p>
            <p>Ada Computing Company · Houston, Texas</p>
            <p className="font-mono text-xs mt-2 text-stone-400">
              "The constraint IS the instruction. The verification IS the computation."
            </p>
            <p className="text-xs text-stone-400 mt-3">© 2025–2026 Jared Nashon Lewis</p>
          </div>
        </GlassPanel>
      </div>
    </PageContainer>
  );
};
