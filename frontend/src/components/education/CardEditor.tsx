import React from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { Card } from '@/api/newton';

interface CardEditorProps {
  card: Card;
}

export const CardEditor: React.FC<CardEditorProps> = ({ card }) => (
  <GlassPanel padding="md">
    <div className="flex items-center gap-2 mb-2">
      <span className="font-mono text-xs text-sequoia-sky">{card.id.slice(0, 8)}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-md bg-sequoia-sage/15 text-sequoia-sage">
        {card.card_type}
      </span>
    </div>
    <h4 className="font-heading font-semibold text-lg mb-2">{card.title}</h4>
    <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
      {card.content}
    </p>
  </GlassPanel>
);
