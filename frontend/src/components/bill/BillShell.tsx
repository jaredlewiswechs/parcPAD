import React, { useRef, useEffect, useState } from 'react';
import { BillMessage } from './BillMessage';
import { BillInput } from './BillInput';
import { BillSuggestions } from './BillSuggestions';
import { LoadingTrail } from '@/components/shared/LoadingTrail';
import { useAsk, useVerify, useCalculate, useCartridgeAuto, useEducationLesson } from '@/hooks/useNewton';
import {
  puterChat,
  buildConstrainedPrompt,
  buildRepairPrompt,
  buildTeachPrompt,
  MAX_REPAIRS,
} from '@/api/puter';
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
  content:   'Hello! I\'m BILL — your verified reasoning assistant powered by Newton v2.0 + Puter.js.\n\nEvery response you see has passed Newton\'s law gate. The LLM (Ada) proposes; Newton verifies; you see only admissible output.\n\nTry: "explain photosynthesis to a 10-year-old", "teach me about Newton\'s laws", "verify: the earth is round", or "calculate: sqrt(256)".',
  timestamp: new Date(),
};

export const BillShell: React.FC = () => {
  const [messages, setMessages]           = useState<Message[]>([WELCOME]);
  const [loading, setLoading]             = useState(false);
  const [loadingMessage, setLoadingMsg]   = useState<string>('Newton is thinking…');
  const bottomRef = useRef<HTMLDivElement>(null);

  const askMut    = useAsk();
  const verifyMut = useVerify();
  const calcMut   = useCalculate();
  const cartMut   = useCartridgeAuto();
  const lessonMut = useEducationLesson();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  };

  const handleSend = async (text: string) => {
    addMessage({ role: 'user', content: text, timestamp: new Date() });
    setLoading(true);

    const { type, arg } = detectCommand(text);

    try {
      let content    = '';
      let result:    NewtonResult | undefined;
      let witness:   Witness | undefined;
      let ledgerStep: number | null | undefined;

      if (type === 'verify') {
        // ── Direct verification ──────────────────────────────────────────────
        setLoadingMsg('Newton verifying…');
        const res  = await verifyMut.mutateAsync({ content: arg });
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        content    = result === 'fin'
          ? `Verification complete — content is admissible.`
          : `Verification result: ${result.toUpperCase()}. ${res.witness.violations.map(v => v.description).join('; ')}`;

      } else if (type === 'calculate') {
        // ── Math evaluation ──────────────────────────────────────────────────
        setLoadingMsg('Newton calculating…');
        const res  = await calcMut.mutateAsync(arg);
        result     = res.result;
        witness    = res.witness;
        ledgerStep = res.ledger_step;
        content    = `${arg} = ${res.payload.result}`;

      } else if (type === 'build') {
        // ── Cartridge auto-route ─────────────────────────────────────────────
        setLoadingMsg('Building cartridge…');
        const res   = await cartMut.mutateAsync(arg);
        result      = res.result;
        witness     = res.witness;
        ledgerStep  = res.ledger_step;
        const ctype = (res.payload as Record<string, unknown>).type ?? 'cartridge';
        content     = `Cartridge built — type: ${ctype}. See the Cartridges tab for the full output.`;

      } else if (type === 'teach') {
        // ── Lesson generation — Newton structures, Ada writes, Newton verifies ─
        setLoadingMsg('Newton structuring lesson…');
        const res   = await lessonMut.mutateAsync({ topic: arg });
        result      = res.result;
        witness     = res.witness;
        ledgerStep  = res.ledger_step;
        const stack = res.payload;

        // puter.js writes real lesson content from Newton's structure
        setLoadingMsg('Ada writing lesson content…');
        try {
          const llmContent = await puterChat(buildTeachPrompt(arg, stack.cards
            ? stack
            : { title: stack.title, cards: [] }));

          // Newton verifies the lesson content
          setLoadingMsg('Newton verifying lesson…');
          const verifyRes = await verifyMut.mutateAsync({ content: llmContent });
          result     = verifyRes.result;
          witness    = verifyRes.witness;
          ledgerStep = verifyRes.ledger_step;
          content    = `## ${stack.title}\n\n${llmContent}`;
        } catch {
          // Fallback: show Newton's own card content if puter.js unavailable
          content = `## ${stack.title}\n\n${stack.cards.map(c => `### ${c.title}\n\n${c.content}`).join('\n\n')}`;
        }

      } else {
        // ── Full Newton / Ada (puter.js) / C loop ────────────────────────────
        //
        // Step 1 — Newton detects constraints from the user prompt
        setLoadingMsg('Newton detecting constraints…');
        const askRes    = await askMut.mutateAsync({ prompt: text });
        const constraints = askRes.payload.constraints;
        const lawsApplied = askRes.payload.laws_applied;

        // Step 2 — Ada (puter.js LLM) proposes a response
        setLoadingMsg('Ada generating via LLM…');
        let llmContent: string;
        let puterWorked = false;

        try {
          llmContent  = await puterChat(buildConstrainedPrompt(text, constraints, lawsApplied));
          puterWorked = true;
        } catch {
          // puter.js unavailable — fall back to Newton symbolic stub
          llmContent = askRes.payload.output || `[Processed: ${text.slice(0, 80)}]`;
        }

        if (puterWorked) {
          // Step 3 — Newton verifies the LLM output (the law gate)
          setLoadingMsg('Newton verifying LLM output…');
          let verifyRes = await verifyMut.mutateAsync({ content: llmContent });
          result    = verifyRes.result;
          witness   = verifyRes.witness;
          ledgerStep = verifyRes.ledger_step;

          // Repair loop — feed violations back to the LLM, re-verify
          let repairAttempts = 0;
          while (verifyRes.result === 'finfr' && repairAttempts < MAX_REPAIRS) {
            repairAttempts++;
            setLoadingMsg(`Repairing constraint violations (attempt ${repairAttempts}/${MAX_REPAIRS})…`);
            try {
              llmContent = await puterChat(
                buildRepairPrompt(text, llmContent, verifyRes.witness.violations),
              );
              verifyRes  = await verifyMut.mutateAsync({ content: llmContent });
              result     = verifyRes.result;
              witness    = verifyRes.witness;
              ledgerStep = verifyRes.ledger_step;
            } catch {
              break; // puter.js failed mid-repair — keep last result
            }
          }
        } else {
          // Newton-only fallback (no puter.js)
          result    = askRes.result;
          witness   = askRes.witness;
          ledgerStep = askRes.ledger_step;
        }

        content = llmContent;
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
      setLoadingMsg('Newton is thinking…');
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
              <LoadingTrail message={loadingMessage} size="sm" />
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
