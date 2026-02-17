import React, { useRef, useEffect, useState } from 'react';
import { BillMessage } from './BillMessage';
import { BillInput } from './BillInput';
import { BillSuggestions } from './BillSuggestions';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { useAsk, useVerify, useCalculate, useCartridgeAuto, useEducationLesson } from '@/hooks/useNewton';
import type { Message } from './BillMessage';
import type { NewtonResult, Witness } from '@/api/newton';

let msgId = 0;
const nextId = () => String(++msgId);

function detectCommand(text: string): {
  type: 'teach' | 'verify' | 'calculate' | 'build' | 'plan' | 'ask';
  arg:  string;
} {
  const t = text.trim().toLowerCase();
  if (t.startsWith('teach '))     return { type: 'teach',     arg: text.slice(6).trim() };
  if (t.startsWith('verify '))    return { type: 'verify',    arg: text.slice(7).trim() };
  if (t.startsWith('calculate ')) return { type: 'calculate', arg: text.slice(10).trim() };
  if (t.startsWith('build '))     return { type: 'build',     arg: text.slice(6).trim() };
  if (t.startsWith('plan '))      return { type: 'plan',      arg: text.slice(5).trim() };
  return { type: 'ask', arg: text };
}

const WELCOME: Message = {
  id:        'welcome',
  role:      'bill',
  content:   'Hello! I\'m BILL — your verified reasoning assistant powered by Newton v2.0.\n\nTry: "teach me about photosynthesis", "verify: the earth is round", "calculate: sqrt(256)", or just ask me anything.',
  timestamp: new Date(),
};

export const BillShell: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const askMut      = useAsk();
  const verifyMut   = useVerify();
  const calcMut     = useCalculate();
  const cartMut     = useCartridgeAuto();
  const lessonMut   = useEducationLesson();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  };

  const handleSend = async (text: string) => {
    // Add user message
    addMessage({ role: 'user', content: text, timestamp: new Date() });
    setLoading(true);

    const { type, arg } = detectCommand(text);

    try {
      let content    = '';
      let result:    NewtonResult | undefined;
      let witness:   Witness | undefined;
      let ledgerStep: number | null | undefined;

      if (type === 'verify') {
        const res  = await verifyMut.mutateAsync({ content: arg });
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        content    = result === 'fin'
          ? `Verification complete — content is admissible.`
          : `Verification result: ${result.toUpperCase()}. ${res.witness.violations.map(v => v.description).join('; ')}`;

      } else if (type === 'calculate') {
        const res  = await calcMut.mutateAsync(arg);
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        content    = `${arg} = ${res.payload.result}`;

      } else if (type === 'build') {
        const res  = await cartMut.mutateAsync(arg);
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        const type2 = (res.payload as Record<string, unknown>).type ?? 'cartridge';
        content    = `Cartridge built — type: ${type2}. See the Cartridges tab for the full output.`;

      } else if (type === 'teach') {
        const res  = await lessonMut.mutateAsync({ topic: arg });
        result     = res.result;
        witness    = res.witness;
        const stack = res.payload;
        content    = `Lesson: **${stack.title}**\n\n${stack.cards[0]?.content.slice(0, 300)}${stack.cards[0]?.content.length > 300 ? '…' : ''}`;

      } else {
        // ask / plan — full Ada pipeline
        const res  = await askMut.mutateAsync({ prompt: text });
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        content    = res.payload.output || `[Processed: ${text.slice(0, 80)}]`;
      }

      addMessage({ role: 'bill', content, result, witness, ledgerStep, timestamp: new Date() });

    } catch (err) {
      addMessage({
        role:      'bill',
        content:   `Error: ${err instanceof Error ? err.message : 'Could not reach Newton API. Is the backend running?'}`,
        result:    'finfr',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {messages.map((msg) => (
          <BillMessage key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-panel rounded-2xl rounded-tl-md px-5 py-4">
              <LoadingTrail message="Newton is verifying…" size="sm" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions + input */}
      <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
        {messages.length <= 1 && (
          <BillSuggestions onSelect={(s) => handleSend(s)} />
        )}
        <BillInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
};
