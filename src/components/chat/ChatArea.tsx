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
        className="flex-1 flex items-center justify-center overflow-y-auto"
      >
        <div className="text-center text-gray-400">
          <h2 className="text-2xl font-semibold mb-2">AI Council</h2>
          <p className="text-sm">{t('chat.welcome')}</p>
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
