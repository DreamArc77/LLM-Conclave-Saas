'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PENDING_PROMPT_KEY } from '@/lib/pending-prompt';

interface DebatePromptBoxProps {
  placeholder: string;
  cta: string;
  note: string;
}

export function DebatePromptBox({ placeholder, cta, note }: DebatePromptBoxProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleSubmit = useCallback(() => {
    const text = value.trim();
    if (!text) {
      textareaRef.current?.focus();
      return;
    }
    try {
      sessionStorage.setItem(PENDING_PROMPT_KEY, text);
    } catch {
      // Private mode etc. — still continue to sign-up without the handoff.
    }
    router.push('/auth/signup');
  }, [value, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.15)] focus-within:border-cyan-300 focus-within:shadow-[0_8px_30px_-6px_rgba(34,211,238,0.3)] transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          rows={2}
          maxLength={2000}
          className="w-full resize-none rounded-2xl bg-transparent px-5 pt-4 pb-2 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-xs text-gray-400">{note}</span>
          <button
            type="button"
            onClick={handleSubmit}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_20px_rgba(138,43,226,0.35)] disabled:opacity-50"
          >
            {cta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
