import React from 'react';
import { clsx } from '@/lib/clsx';

interface BillSuggestionsProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  'Teach me about Newton\'s laws',
  'Verify: The sky is blue',
  'Calculate: sqrt(144) + pi',
  'Build a data visualization',
  'Plan a lesson on fractions',
];

export const BillSuggestions: React.FC<BillSuggestionsProps> = ({ onSelect }) => (
  <div className="flex flex-wrap gap-2 px-1" role="group" aria-label="Quick suggestions">
    {SUGGESTIONS.map((s) => (
      <button
        key={s}
        onClick={() => onSelect(s)}
        className={clsx(
          'text-sm px-3 py-1.5 rounded-full',
          'glass-panel hover:brightness-105 active:scale-95',
          'text-stone-600 dark:text-stone-300',
          'transition-all duration-150',
        )}
      >
        {s}
      </button>
    ))}
  </div>
);
