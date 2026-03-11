'use client';

import { useChatStore } from '@/stores/chat-store';
import { useConfigStore } from '@/stores/config-store';
import { ProviderLogo } from '@/components/common/ProviderLogo';
import { useT } from '@/hooks/useT';

export function StreamingBubble() {
  const relay = useChatStore((s) => s.relay);
  const t = useT();

  // Show as long as relay is running and a model has been assigned
  if (relay.status !== 'running' || relay.currentModelIndex < 0) return null;

  const enabledModels = useConfigStore.getState().getEnabledModels();
  const activeModel = enabledModels[relay.currentModelIndex];
  const hasContent = !!relay.streamingContent;

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          {activeModel?.providerId && (
            <ProviderLogo providerId={activeModel.providerId} size={20} />
          )}
          <span className="text-sm font-medium text-gray-500">
            {relay.currentModelName}
          </span>
          <span className="text-xs text-green-500 animate-pulse">
            {hasContent ? t('chat.generating') : t('chat.thinking')}
          </span>
        </div>
        <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3">
          {hasContent ? (
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-base">
              {relay.streamingContent}
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
