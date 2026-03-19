'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useConfigStore } from '@/stores/config-store';
import { ModelList } from './ModelList';
import { AddModelDialog } from './AddModelDialog';
import { useT } from '@/hooks/useT';
import { MAX_ROUNDS_HARD_LIMIT } from '@/config/credit-packages';
import { ALLOW_CUSTOM_MODELS } from '@/config/feature-flags';
import { interpolate } from '@/i18n';

type InviteInfo = { code: string; useCount: number; maxUses: number } | null;

export function SettingsDrawer() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const maxRounds = useConfigStore((s) => s.maxRounds);
  const setMaxRounds = useConfigStore((s) => s.setMaxRounds);
  const exportFormat = useConfigStore((s) => s.exportFormat);
  const setExportFormat = useConfigStore((s) => s.setExportFormat);

  // Local string state so user can freely delete digits before typing a new value.
  // We only clamp to [1, MAX_ROUNDS_HARD_LIMIT] on blur.
  const t = useT();
  const [roundsInput, setRoundsInput] = useState(String(maxRounds));
  useEffect(() => { setRoundsInput(String(maxRounds)); }, [maxRounds]);

  const [inviteInfo, setInviteInfo] = useState<InviteInfo>(null);
  const [copied, setCopied] = useState(false);

  const fetchInviteCode = useCallback(async () => {
    try {
      const res = await fetch('/api/invite/my-code');
      if (res.ok) setInviteInfo(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (settingsOpen && !inviteInfo) fetchInviteCode();
  }, [settingsOpen, inviteInfo, fetchInviteCode]);

  const handleCopy = async () => {
    if (!inviteInfo) return;
    await navigator.clipboard.writeText(inviteInfo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closeSettings}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ${
          settingsOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold">{t('settings.title')}</h2>
          <button
            onClick={closeSettings}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-49px)] px-4 py-3">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <label className="text-sm text-gray-600 dark:text-gray-400">{t('settings.maxRounds')}</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_ROUNDS_HARD_LIMIT}
              value={roundsInput}
              onChange={(e) => setRoundsInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(roundsInput, 10);
                const clamped = isNaN(n) || n < 1 ? 1 : n > MAX_ROUNDS_HARD_LIMIT ? MAX_ROUNDS_HARD_LIMIT : n;
                setMaxRounds(clamped);
                setRoundsInput(String(clamped));
              }}
              className="w-14 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-base sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <label className="text-sm text-gray-600 dark:text-gray-400">{t('settings.exportFormat')}</label>
            <div className="flex rounded overflow-hidden border border-gray-300 dark:border-gray-600 text-xs font-medium">
              {(['pdf', 'png'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-3 py-1 uppercase transition-colors ${
                    exportFormat === fmt
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Invite Code */}
          <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">{t('invite.title')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{t('invite.description')}</p>
            {inviteInfo ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-sm tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-gray-900 dark:text-gray-100 select-all">
                  {inviteInfo.code}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('invite.copied') : t('invite.copy')}
                </button>
              </div>
            ) : (
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            )}
            {inviteInfo && (
              <p className="text-xs text-gray-400 mt-1.5">
                {interpolate(t('invite.usageCount'), { count: inviteInfo.useCount, max: inviteInfo.maxUses })}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-3">{t('settings.instruction')}</p>

          <ModelList />

          {ALLOW_CUSTOM_MODELS && (
            <div className="mt-3">
              <AddModelDialog />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
