'use client';

import { useState, useEffect, useCallback } from'react';
import { Code2, Copy, Check, Trash2, RefreshCw } from'lucide-react';
import { useT } from'@/hooks/useT';
import { interpolate } from'@/i18n';

interface KeyStatus {
 hasKey: boolean;
 createdAt?: string;
 lastUsedAt?: string;
}

export function ApiKeyPanel() {
 const t = useT();
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
 const res = await fetch('/api/account/apikey', { method:'POST'});
 if (res.ok) {
 const { apiKey } = await res.json();
 setNewKey(apiKey);
 await fetchStatus();
 }
 setLoading(false);
 }

 async function handleRevoke() {
 if (!confirm(t('billing.apiKeyRevokeConfirm'))) return;
 setLoading(true);
 await fetch('/api/account/apikey', { method:'DELETE'});
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
 ?`llmc_${'*'.repeat(20)}`// just show prefix + mask
 : null;

 const createdDate = status?.createdAt
 ? new Date(status.createdAt).toLocaleDateString()
 : null;

 return (
 <div>
 <div className="flex items-center gap-2 mb-3">
 <Code2 className="w-5 h-5 text-blue-500"/>
 <h2 className="text-base font-semibold text-[#111111]">{t('billing.apiKeyTitle')}</h2>
 </div>
 <p className="text-sm text-gray-500 mb-4">
 {t('billing.apiKeyDesc')}{''}
 <a href="/skill.md"target="_blank"rel="noopener noreferrer"
 className="text-blue-500 hover:underline">{t('billing.apiKeyDocs')}</a>
 </p>

 {/* Newly generated key — show once */}
 {newKey && (
 <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
 <p className="text-xs font-semibold text-yellow-700 mb-2">
 ⚠ {t('billing.apiKeyCopyHint')}
 </p>
 <div className="flex items-center gap-2">
 <code className="flex-1 text-xs font-mono bg-white border border-[#E5E0D8] rounded px-2 py-1.5 break-all text-[#1A1A1A]">
 {newKey}
 </code>
 <button
 onClick={handleCopy}
 className="shrink-0 p-1.5 rounded text-gray-500 hover:text-gray-700 border border-[#E5E0D8]"
 >
 {copied ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
 </button>
 </div>
 </div>
 )}

 {/* Existing key info */}
 {!newKey && status?.hasKey && (
 <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-[#E5E0D8]">
 <div>
 <code className="text-sm font-mono text-gray-700">{maskedKey}</code>
 {createdDate && (
 <p className="text-xs text-[#5D5C5A] mt-0.5">{interpolate(t('billing.apiKeyCreated'), { date: createdDate })}</p>
 )}
 </div>
 <button
 onClick={handleRevoke}
 disabled={loading}
 className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
 >
 <Trash2 className="w-3.5 h-3.5"/>
 {t('billing.apiKeyRevoke')}
 </button>
 </div>
 )}

 {/* Generate / Regenerate button */}
 <button
 onClick={handleGenerate}
 disabled={loading}
 className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-[#111111] rounded-lg disabled:opacity-50 transition-colors"
 >
 <RefreshCw className={`w-4 h-4 ${loading ?'animate-spin':''}`} />
 {status?.hasKey ? t('billing.apiKeyRegenerate') : t('billing.apiKeyGenerate')}
 </button>
 </div>
 );
}
