import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mic } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import { clsx } from '@/lib/clsx';

interface BillInputProps {
  onSend:   (text: string) => void;
  loading?: boolean;
}

export const BillInput: React.FC<BillInputProps> = ({ onSend, loading }) => {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setValue('');
    if (taRef.current) {
      taRef.current.style.height = 'auto';
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = () => {
    if (!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = `${taRef.current.scrollHeight}px`;
  };

  return (
    <GlassPanel padding="sm" className="flex items-end gap-2">
      {/* Text area */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onInput={onInput}
        placeholder="Ask BILL anything… (Enter to send, Shift+Enter for newline)"
        rows={1}
        disabled={loading}
        className={clsx(
          'flex-1 resize-none bg-transparent outline-none',
          'text-stone-800 dark:text-stone-100 placeholder:text-stone-400',
          'font-ui text-base leading-relaxed py-1',
          'max-h-40 overflow-y-auto',
          loading && 'opacity-50',
        )}
        aria-label="Message input"
      />

      {/* Mic icon (decorative / future voice) */}
      <button
        disabled
        className="p-2 rounded-xl text-stone-400 cursor-default"
        aria-label="Voice input (coming soon)"
        title="Voice input — coming soon"
      >
        <Mic size={18} />
      </button>

      {/* Send button */}
      <button
        onClick={submit}
        disabled={!value.trim() || loading}
        className={clsx(
          'p-2 rounded-xl transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-sequoia-sage',
          value.trim() && !loading
            ? 'bg-sequoia-sage text-white hover:bg-sequoia-forest active:scale-95'
            : 'text-stone-300 dark:text-stone-600 cursor-not-allowed',
        )}
        aria-label="Send message"
      >
        {loading
          ? <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
          : <Send size={18} />
        }
      </button>
    </GlassPanel>
  );
};
