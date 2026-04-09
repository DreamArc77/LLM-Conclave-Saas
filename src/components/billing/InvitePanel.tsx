'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Gift } from 'lucide-react';
import { interpolate } from '@/i18n';
import { useT } from '@/hooks/useT';

type InviteInfo = { code: string; useCount: number; maxUses: number };

export function InvitePanel() {
  const t = useT();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/invite/my-code')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setInfo(data); })
      .catch(() => {});
  }, []);

  const handleCopy = async () => {
    if (!info) return;
    await navigator.clipboard.writeText(info.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-green-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('invite.title')}</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('invite.description')}</p>

      {info ? (
        <>
          <div className="flex items-center gap-2">
            <span className="flex-1 font-mono text-lg tracking-[0.25em] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-lg text-gray-900 dark:text-gray-100 select-all">
              {info.code}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? t('invite.copied') : t('invite.copy')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {interpolate(t('invite.usageCount'), { count: info.useCount, max: info.maxUses })}
          </p>
        </>
      ) : (
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      )}
    </div>
  );
}
