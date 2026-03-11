'use client';

import { Settings, Menu, Zap } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useConfigStore } from '@/stores/config-store';
import { useUIStore } from '@/stores/ui-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useT } from '@/hooks/useT';

export function StatusBar() {
  const relay = useChatStore((s) => s.relay);
  const enabledCount = useConfigStore((s) => s.models.filter((m) => m.enabled).length);
  const maxRounds = useConfigStore((s) => s.maxRounds);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openSettings = useUIStore((s) => s.openSettings);
  const t = useT();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold">{t('app.name')}</h1>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Zap className="w-3.5 h-3.5" />
          <span>{t('status.models', { count: enabledCount })}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {relay.status === 'running' && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-600">
              {t('status.round', {
                round: relay.round + 1,
                maxRounds,
                modelName: relay.currentModelName ?? '',
              })}
            </span>
          </div>
        )}

        {relay.status === 'error' && (
          <span className="text-sm text-red-500">{t('status.error')}</span>
        )}

        {relay.status === 'idle' && (
          <span className="text-sm text-gray-400">{t('status.idle')}</span>
        )}

        <LanguageSwitcher />

        <button
          onClick={openSettings}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
