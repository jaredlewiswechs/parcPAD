import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

          {/* Content — rendered as Markdown for BILL responses */}
          <div
            className="text-stone-800 dark:text-stone-100 text-base pr-20 prose prose-stone dark:prose-invert prose-sm max-w-none"
            role="status"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1 text-stone-800 dark:text-stone-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1 text-stone-800 dark:text-stone-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-stone-700 dark:text-stone-200">{children}</h3>,
                p:  ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-stone-900 dark:text-stone-50">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">{children}</code>,
                pre: ({ children }) => <pre className="font-mono text-xs bg-black/5 dark:bg-white/10 p-3 rounded-lg overflow-auto my-2">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-sequoia-sage/40 pl-3 italic text-stone-600 dark:text-stone-400 my-2">{children}</blockquote>,
                hr: () => <hr className="border-black/10 dark:border-white/10 my-3" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

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
