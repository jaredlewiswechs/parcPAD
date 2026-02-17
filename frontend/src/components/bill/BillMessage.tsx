import React from 'react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { StatusLight } from '@/components/shared/StatusLight';
import { WitnessCard } from '@/components/shared/WitnessCard';
import type { NewtonResult, Witness } from '@/api/newton';
import { clsx } from '@/lib/clsx';

export interface Message {
  id:          string;
  role:        'user' | 'bill';
  content:     string;
  result?:     NewtonResult;
  witness?:    Witness;
  ledgerStep?: number | null;
  timestamp:   Date;
}

interface BillMessageProps {
  message: Message;
}

export const BillMessage: React.FC<BillMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] bg-sequoia-sage/20 border border-sequoia-sage/25 rounded-2xl rounded-tr-md px-4 py-3">
          <p className="text-stone-800 dark:text-stone-100 whitespace-pre-wrap text-base">
            {message.content}
          </p>
          <p className="text-xs text-stone-400 mt-1 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="max-w-[88%] space-y-2">
        <GlassPanel
          status={message.result ?? 'neutral'}
          padding="md"
          className="rounded-2xl rounded-tl-md relative"
        >
          {/* Status indicator (top right) */}
          {message.result && (
            <div className="absolute top-3 right-3">
              <StatusLight result={message.result} showLabel size="sm" />
            </div>
          )}

          {/* Content */}
          <p
            className="text-stone-800 dark:text-stone-100 whitespace-pre-wrap text-base pr-20"
            role="status"
          >
            {message.content}
          </p>

          <p className="text-xs text-stone-400 mt-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </GlassPanel>

        {/* Witness (collapsible) */}
        {message.witness && (
          <WitnessCard
            witness={message.witness}
            ledgerStep={message.ledgerStep}
            collapsible
            defaultOpen={false}
          />
        )}
      </div>
    </div>
  );
};
