'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Copy, Check, X } from 'lucide-react';
import { useT } from '@/hooks/useT';

const SKILL_URL = 'https://llmconclave.com/skill.md';
const READ_CMD = `Read ${SKILL_URL} and follow the instructions`;

export function AgentSkillPopover() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleCopy() {
    navigator.clipboard.writeText(READ_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          bg-blue-50 text-blue-700 border border-blue-200
          hover:bg-blue-100 hover:border-blue-300
          dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800
          dark:hover:bg-blue-900 dark:hover:border-blue-700
          transition-colors"
      >
        <Bot className="w-3.5 h-3.5" />
        {t('agentSkill.buttonLabel')}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 rounded-xl shadow-xl border
          bg-gray-900 border-gray-700 text-white
          animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between px-4 pt-4 pb-3">
            <div>
              <h3 className="text-sm font-semibold leading-tight">
                {t('agentSkill.title')}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('agentSkill.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors ml-2 mt-0.5 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copy command */}
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5 border border-gray-700">
              <code className="flex-1 text-xs text-green-400 font-mono leading-snug break-all">
                {READ_CMD}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 px-0.5">
              {t('agentSkill.cmdHint')}
            </p>
          </div>

          {/* Steps */}
          <div className="px-4 pb-4 space-y-2.5">
            {(['step1', 'step2', 'step3'] as const).map((key, i) => (
              <div key={key} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-300 leading-snug">{t(`agentSkill.${key}`)}</span>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="px-4 pb-4">
            <a
              href="/skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              {t('agentSkill.docsLink')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
