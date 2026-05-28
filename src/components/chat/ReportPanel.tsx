'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { marked } from 'marked';
import { useT } from '@/hooks/useT';
import { useConfigStore } from '@/stores/config-store';
import { generatePDFBlob, generatePNGBlob } from '@/lib/export/pdf-export';
import type { Locale } from '@/i18n';

interface ReportPanelProps {
  markdown: string;
  filename: string;
  locale: Locale;
  onClose: () => void;
}

export function ReportPanel({ markdown, filename, locale, onClose }: ReportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const exportFormat = useConfigStore((s) => s.exportFormat);
  const t = useT();

  const html = marked.parse(markdown) as string;
  const baseFilename = filename.replace(/\.[^.]+$/, '');

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = exportFormat === 'pdf'
        ? await generatePDFBlob(markdown, locale)
        : await generatePNGBlob(markdown, locale);
      const mimeType = exportFormat === 'pdf' ? 'application/pdf' : 'image/png';
      const file = new File([blob], `${baseFilename}.${exportFormat}`, { type: mimeType });
      if (typeof navigator.share === 'function') {
        await navigator.share({ files: [file], title: baseFilename });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[ReportPanel] Export failed:', err);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
          {baseFilename}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? t('export.generating') : t('export.exportFromPanel')}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
