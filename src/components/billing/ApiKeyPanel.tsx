'use client';

import { useState, useEffect, useCallback } from 'react';
import { Code2, Copy, Check, Trash2, RefreshCw } from 'lucide-react';

interface KeyStatus {
  hasKey: boolean;
  createdAt?: string;
  lastUsedAt?: string;
}

export function ApiKeyPanel() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/account/apikey');
    if (res.ok) setStatus(await res.json());
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleGenerate() {
    setLoading(true);
    setNewKey(null);
    const res = await fetch('/api/account/apikey', { method: 'POST' });
    if (res.ok) {
      const { apiKey } = await res.json();
      setNewKey(apiKey);
      await fetchStatus();
    }
    setLoading(false);
  }

  async function handleRevoke() {
    if (!confirm('Revoke this API key? Any agent using it will lose access immediately.')) return;
    setLoading(true);
    await fetch('/api/account/apikey', { method: 'DELETE' });
    setNewKey(null);
    await fetchStatus();
    setLoading(false);
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maskedKey = status?.hasKey
    ? `llmc_${'*'.repeat(20)}` // just show prefix + mask
    : null;

  const createdDate = status?.createdAt
    ? new Date(status.createdAt).toLocaleDateString()
    : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="w-5 h-5 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Agent API Key</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Allows AI agents to call the debate API on your behalf.{' '}
        <a href="/skill.md" target="_blank" rel="noopener noreferrer"
           className="text-blue-500 hover:underline">View skill docs →</a>
      </p>

      {/* Newly generated key — show once */}
      {newKey && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
            ⚠ Copy now — this key won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 break-all text-gray-800 dark:text-gray-200">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Existing key info */}
      {!newKey && status?.hasKey && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-200 dark:border-gray-600">
          <div>
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{maskedKey}</code>
            {createdDate && (
              <p className="text-xs text-gray-400 mt-0.5">Created {createdDate}</p>
            )}
          </div>
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Revoke
          </button>
        </div>
      )}

      {/* Generate / Regenerate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {status?.hasKey ? 'Regenerate Key' : 'Generate API Key'}
      </button>
    </div>
  );
}
