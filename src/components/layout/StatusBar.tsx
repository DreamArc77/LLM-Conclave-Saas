'use client';

import { Settings, Menu, Zap } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { useConfigStore } from '@/stores/config-store';
import { useUIStore } from '@/stores/ui-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useT } from '@/hooks/useT';
import { SaasUserWidget } from '@/components/billing/SaasUserWidget';

const isSaas = process.env.NEXT_PUBLIC_SAAS_MODE === 'true';

export function StatusBar() {
  const relay = useChatStore((s) => s.relay);
  const models = useConfigStore((s) => s.models);
  const enabledCount = models.filter((m) => m.enabled).length;
  const maxRounds = useConfigStore((s) => s.maxRounds);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openSettings = useUIStore((s) => s.openSettings);
  const t = useT();

  const estimatedCost = isSaas
    ? maxRounds * models
        .filter((m) => m.enabled && m.isPreset && m.creditsPerRound != null)
        .reduce((sum, m) => sum + (m.creditsPerRound ?? 0), 0)
    : 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="hidden sm:block text-base font-semibold">{t('app.name')}</h1>

        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
          <Zap className="w-3.5 h-3.5" />
          <span>{t('status.models', { count: enabledCount })}</span>
          {isSaas && estimatedCost > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">· ~{estimatedCost} cr</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {relay.status === 'running' && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden sm:inline text-sm text-green-600">
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
          <span className="hidden sm:inline text-sm text-gray-400">{t('status.idle')}</span>
        )}

        <SaasUserWidget />

        <div className="hidden sm:flex">
          <LanguageSwitcher />
        </div>

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
