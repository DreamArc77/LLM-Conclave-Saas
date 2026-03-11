'use client';

import { ProviderLogo } from '@/components/common/ProviderLogo';
import type { ChatMessage } from '@/types/chat';
import type { ProviderId } from '@/types/config';

interface AiBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function AiBubble({ message, isStreaming }: AiBubbleProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          {message.providerId && (
            <ProviderLogo providerId={message.providerId as ProviderId} size={20} />
          )}
          <span className="text-sm font-medium text-gray-500">
            {message.displayName || message.modelId}
          </span>
        </div>
        <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-base">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
