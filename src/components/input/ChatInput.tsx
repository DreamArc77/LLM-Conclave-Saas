'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Send, Square, Trash2 } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useConfigStore } from '@/stores/config-store';
import { executeRelay } from '@/lib/relay/relay-engine';
import { clearSessionMessages } from '@/lib/db/operations';
import { useT } from '@/hooks/useT';
import { useLocaleStore } from '@/stores/locale-store';
import { getMessages } from '@/i18n';
import { isSaasClient } from '@/lib/flags';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth/AuthModal';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const relay = useChatStore((s) => s.relay);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const models = useConfigStore((s) => s.models);
  const enabledModels = models.filter((m) => m.enabled);
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const randomPlaceholder = useMemo(() => {
    const list = getMessages(locale).input.placeholders;
    return list[Math.floor(Math.random() * list.length)];
  }, [locale]);

  const isRunning = relay.status === 'running';
  const canSend = input.trim().length > 0 && !isRunning && !isSending && enabledModels.length > 0;

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isRunning || isSending) return;

    setIsSending(true);
    try {
      if (isSaasClient) {
        try {
          const { data: { user } } = await createClient().auth.getUser();
          if (!user) {
            setShowAuthModal(true);
            return;
          }
        } catch {
          setShowAuthModal(true);
          return;
        }
      }

      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      await executeRelay(activeSessionId, message);
    } finally {
      setIsSending(false);
    }
  }, [input, isRunning, isSending, activeSessionId]);

  const handleStop = useCallback(() => {
    const ac = useChatStore.getState().relay.abortController;
    ac?.abort();
  }, []);

  const handleClear = useCallback(async () => {
    if (!activeSessionId) return;
    await clearSessionMessages(activeSessionId);
    clearMessages();
  }, [activeSessionId, clearMessages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (canSend) handleSend();
      }
    },
    [canSend, handleSend]
  );

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  return (
    <>
    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {activeSessionId && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title={t('input.clearConversation')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={
              enabledModels.length === 0
                ? t('input.placeholderNoModels')
                : randomPlaceholder
            }
            disabled={enabledModels.length === 0}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {isRunning ? (
          <button
            onClick={handleStop}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            title={t('input.stopRelay')}
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t('input.sendMessage')}
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
    </>
  );
}
