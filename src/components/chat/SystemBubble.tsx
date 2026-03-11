'use client';

import { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { useConfigStore } from '@/stores/config-store';
import { useLocaleStore } from '@/stores/locale-store';
import { useT } from '@/hooks/useT';
import type { ChatMessage } from '@/types/chat';

interface SystemBubbleProps {
  message: ChatMessage;
}

type DownloadState =
  | { phase: 'idle' }
  | { phase: 'generating' }
  | { phase: 'ready'; blob: Blob; filename: string; mimeType: string; objectUrl: string }
  | { phase: 'error'; message: string };

export function SystemBubble({ message }: SystemBubbleProps) {
  const [dlState, setDlState] = useState<DownloadState>({ phase: 'idle' });
  const exportFormat = useConfigStore((s) => s.exportFormat);
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  // Revoke object URL when leaving 'ready' state to avoid memory leaks
  useEffect(() => {
    if (dlState.phase === 'ready') {
      return () => URL.revokeObjectURL(dlState.objectUrl);
    }
  }, [dlState]);

  const handleGenerate = async () => {
    if (!message.reportMarkdown || !message.reportFilename) return;
    const base = message.reportFilename.replace(/\.[^.]+$/, '');
    const filename = `${base}.${exportFormat}`;
    const mimeType = exportFormat === 'pdf' ? 'application/pdf' : 'image/png';

    setDlState({ phase: 'generating' });
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: message.reportMarkdown,
          format: exportFormat,
          filename,
          locale,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || t('export.serverError', { status: res.status }));
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDlState({ phase: 'ready', blob, filename, mimeType, objectUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('export.generateFailed');
      setDlState({ phase: 'error', message: msg });
    }
  };

  const handleSave = (blob: Blob, filename: string, mimeType: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && typeof navigator.share === 'function') {
      const file = new File([blob], filename, { type: mimeType });
      navigator.share({ files: [file], title: filename }).catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') {
          // User closed share sheet — stay on ready state
        } else {
          setDlState((s) =>
            s.phase === 'ready'
              ? { phase: 'error', message: err instanceof Error ? err.message : t('export.shareFailed') }
              : s
          );
        }
      });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  };

  const btnBase = 'flex items-center gap-1.5 transition-colors text-xs font-medium';

  return (
    <div className="flex justify-center px-4 py-2">
      <div className="flex items-start gap-2 max-w-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
        <div className="flex-1">
          <span className="whitespace-pre-line italic">{message.content}</span>
          {message.reportMarkdown && (
            <div className="mt-2">
              {dlState.phase === 'idle' && (
                <button onClick={handleGenerate} className={`${btnBase} text-blue-500 hover:text-blue-600`}>
                  <Download className="w-3.5 h-3.5" />
                  {t('export.exportReport', {
                    filename: message.reportFilename?.replace(/\.[^.]+$/, '') ?? '',
                    format: exportFormat,
                  })}
                </button>
              )}
              {dlState.phase === 'generating' && (
                <button disabled className={`${btnBase} text-gray-400 opacity-50 cursor-not-allowed`}>
                  <Download className="w-3.5 h-3.5" />
                  {t('export.generating')}
                </button>
              )}
              {dlState.phase === 'ready' && (
                <div className="space-y-2">
                  {dlState.mimeType === 'image/png' && (
                    <img
                      src={dlState.objectUrl}
                      alt={dlState.filename}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  )}
                  <button
                    onClick={() => handleSave(dlState.blob, dlState.filename, dlState.mimeType)}
                    className={`${btnBase} text-green-600 hover:text-green-700`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t('export.save', { filename: dlState.filename })}
                  </button>
                </div>
              )}
              {dlState.phase === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xs">{dlState.message}</span>
                  <button
                    onClick={() => setDlState({ phase: 'idle' })}
                    className="text-blue-500 hover:text-blue-600 text-xs underline"
                  >
                    {t('export.retry')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
