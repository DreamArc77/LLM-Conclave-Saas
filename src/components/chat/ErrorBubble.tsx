'use client';

import { AlertCircle } from 'lucide-react';
import { ProviderLogo } from '@/components/common/ProviderLogo';
import type { ChatMessage } from '@/types/chat';
import type { ProviderId } from '@/types/config';
import { useT } from '@/hooks/useT';

interface ErrorBubbleProps {
  message: ChatMessage;
}

export function ErrorBubble({ message }: ErrorBubbleProps) {
  const t = useT();
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
        <div className="rounded-2xl rounded-bl-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-base text-red-600 dark:text-red-400">
              {message.errorMessage || t('chat.error')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
