'use client';

import type { ChatMessage } from '@/types/chat';

interface UserBubbleProps {
  message: ChatMessage;
}

export function UserBubble({ message }: UserBubbleProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-blue-600 text-white px-4 py-3">
        <p className="whitespace-pre-wrap text-base">{message.content}</p>
      </div>
    </div>
  );
}
