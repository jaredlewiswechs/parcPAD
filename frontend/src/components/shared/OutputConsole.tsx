import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from '@/lib/clsx';

export interface OutputConsoleProps {
  lines:      string[];
  title?:     string;
  /** Default collapsed state. */
  collapsed?: boolean;
}

/**
 * Terminal-style output panel for displaying cartridge computation logs.
 * Mirrors a Python REPL / stdout window.
 */
export const OutputConsole: React.FC<OutputConsoleProps> = ({
  lines,
  title     = 'output',
  collapsed = false,
}) => {
  const [open, setOpen] = useState(!collapsed);

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
      {/* Title bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center gap-2 px-4 py-2.5',
          'bg-stone-900 dark:bg-stone-950 text-stone-300',
          'hover:bg-stone-800 dark:hover:bg-stone-900 transition-colors duration-150',
          'text-left',
        )}
        aria-expanded={open}
      >
        <Terminal size={14} className="text-sequoia-sage flex-shrink-0" />
        <span className="font-mono text-xs flex-1 text-stone-400">
          <span className="text-sequoia-sage">$</span> {title}
        </span>
        {open
          ? <ChevronDown size={14} className="text-stone-500" />
          : <ChevronRight size={14} className="text-stone-500" />}
      </button>

      {/* Output lines */}
      {open && (
        <div className="bg-stone-950 dark:bg-black px-4 py-3 overflow-auto max-h-64">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-stone-600 font-mono text-xs w-7 flex-shrink-0 text-right pr-2 pt-px">
                {i + 1}
              </span>
              <pre
                className={clsx(
                  'font-mono text-xs leading-5 whitespace-pre-wrap break-all',
                  line.startsWith('✓')
                    ? 'text-sequoia-sage'
                    : line.startsWith('✗') || line.toLowerCase().includes('error')
                    ? 'text-red-400'
                    : line.startsWith('  ')
                    ? 'text-stone-300'
                    : 'text-stone-100',
                )}
              >
                {line}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
