'use client';

import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '@/stores/config-store';
import { PROVIDER_REGISTRY, PROVIDER_LIST } from '@/lib/providers/registry';
import type { ProviderId } from '@/types/config';
import { useT } from '@/hooks/useT';

export function AddModelDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [modelId, setModelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const addModel = useConfigStore((s) => s.addModel);
  const t = useT();

  const provider = PROVIDER_REGISTRY[providerId];

  const handleProviderChange = (newId: ProviderId) => {
    setProviderId(newId);
    const newProvider = PROVIDER_REGISTRY[newId];
    setBaseUrl(newProvider.defaultBaseUrl);
    setModelId('');
    setDisplayName('');
  };

  const handleAdd = () => {
    if (!modelId.trim() || !apiKey.trim()) return;

    addModel({
      providerId,
      modelId: modelId.trim(),
      displayName: displayName.trim() || modelId.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || provider.defaultBaseUrl,
      enabled: true,
    });

    setModelId('');
    setDisplayName('');
    setApiKey('');
    setBaseUrl('');
    setIsOpen(false);
  };

  const handleQuickAdd = (defaultModel: string) => {
    if (!apiKey.trim()) return;

    addModel({
      providerId,
      modelId: defaultModel,
      displayName: defaultModel,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || provider.defaultBaseUrl,
      enabled: true,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setBaseUrl(provider.defaultBaseUrl);
        }}
        className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('settings.addModel')}
      </button>
    );
  }

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/10">
      <h4 className="text-xs font-semibold mb-3">{t('settings.addModelTitle')}</h4>
      <div className="space-y-3">
        {/* Provider selector */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.provider')}</label>
          <select
            value={providerId}
            onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PROVIDER_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.apiKey')} *</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.endpointUrl')}</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={provider.defaultBaseUrl || 'https://...'}
            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Quick add default models */}
        {provider.defaultModels.length > 0 && apiKey.trim() && (
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.quickAdd')}</label>
            <div className="flex flex-wrap gap-1">
              {provider.defaultModels.map((dm) => (
                <button
                  key={dm}
                  onClick={() => handleQuickAdd(dm)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  + {dm}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Model ID (manual) */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.modelId')} *</label>
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="e.g. gpt-4o"
            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Display name */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">{t('settings.displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={modelId || t('settings.displayNamePlaceholder')}
            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAdd}
            disabled={!modelId.trim() || !apiKey.trim()}
            className="flex-1 text-xs py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('settings.addModel')}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setModelId('');
              setDisplayName('');
              setApiKey('');
              setBaseUrl('');
            }}
            className="flex-1 text-xs py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('settings.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
