import React from 'react';
import { useCalculateExamples } from '@/hooks/useNewton';
import { GlassPanel } from '@/components/shared/GlassPanel';

interface ExampleListProps {
  onSelect: (expr: string) => void;
}

export const ExampleList: React.FC<ExampleListProps> = ({ onSelect }) => {
  const { data, isLoading } = useCalculateExamples();

  if (isLoading) return null;
  if (!data?.examples?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm text-stone-500 dark:text-stone-400">Examples</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.examples.map((ex) => (
          <GlassPanel
            key={ex.expression}
            padding="sm"
            className="cursor-pointer hover:brightness-105 active:scale-95 transition-all"
            onClick={() => onSelect(ex.expression)}
          >
            <p className="font-mono text-xs text-stone-500 truncate">{ex.expression}</p>
            <p className="font-mono text-sm font-semibold text-sequoia-sage mt-0.5">= {ex.result}</p>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
};
