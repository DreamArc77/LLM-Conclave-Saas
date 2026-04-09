'use client';

import { useChatStore } from '@/stores/chat-store';
import { MessageBubble } from './MessageBubble';
import { StreamingBubble } from './StreamingBubble';
import { useAutoScroll } from '@/components/common/ScrollAnchor';
import { useT } from '@/hooks/useT';

export function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const relay = useChatStore((s) => s.relay);
  const scrollRef = useAutoScroll(
    relay.streamingContent || `${messages.length}:${relay.currentModelIndex}`
  );
  const t = useT();

  if (messages.length === 0 && relay.status === 'idle') {
    return (
      <div
        ref={scrollRef}
        className="flex-1 flex items-center justify-center overflow-y-auto px-4"
      >
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-semibold mb-3 text-gray-500 dark:text-gray-300">LLM Conclave</h2>
          <p className="text-sm text-gray-400">{t('chat.welcomeDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <StreamingBubble />
      </div>
    </div>
  );
}
