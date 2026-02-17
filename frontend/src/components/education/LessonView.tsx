import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { Button } from '@/components/shared/Button';
import type { LessonPayload, Card } from '@/api/newton';

interface LessonViewProps {
  lesson: LessonPayload;
}

function CardView({ card }: { card: Card }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sequoia-sage/15 text-sequoia-sage border border-sequoia-sage/25">
          {card.card_type}
        </span>
      </div>
      <h3 className="heading-lg">{card.title}</h3>
      <div className="prose-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
        {card.content}
      </div>
      {card.metadata?.grade && (
        <p className="text-xs text-stone-400">Grade: {String(card.metadata.grade)}</p>
      )}
    </div>
  );
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson }) => {
  const [index, setIndex] = useState(0);
  const cards = lesson.cards ?? [];
  const card  = cards[index];

  if (!cards.length) {
    return <p className="text-stone-400 text-sm text-center py-8">No cards in this lesson.</p>;
  }

  return (
    <div className="space-y-4">
      {/* TEKS alignment */}
      {lesson.teks_alignment && lesson.teks_alignment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lesson.teks_alignment.map((code) => (
            <span
              key={code}
              className="text-xs font-mono px-2 py-0.5 rounded-full bg-sequoia-sky/15 text-sequoia-sky border border-sequoia-sky/25"
            >
              {code}
            </span>
          ))}
        </div>
      )}

      {/* Card */}
      <GlassPanel padding="lg" className="min-h-[200px]">
        {card && <CardView card={card} />}
      </GlassPanel>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          leftIcon={<ChevronLeft size={16} />}
        >
          Previous
        </Button>

        <span className="text-sm text-stone-400">
          {index + 1} / {cards.length}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
          disabled={index === cards.length - 1}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};
