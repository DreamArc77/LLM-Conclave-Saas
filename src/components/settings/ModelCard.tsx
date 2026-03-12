'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Zap } from 'lucide-react';
import { ProviderLogo } from '@/components/common/ProviderLogo';
import { useConfigStore } from '@/stores/config-store';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import type { ModelConfig } from '@/types/config';
import { useT } from '@/hooks/useT';

interface ModelCardProps {
  model: ModelConfig;
}

export function ModelCard({ model }: ModelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const toggleModel = useConfigStore((s) => s.toggleModel);
  const removeModel = useConfigStore((s) => s.removeModel);
  const updateModel = useConfigStore((s) => s.updateModel);
  const t = useT();

  const provider = PROVIDER_REGISTRY[model.providerId];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: model.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const maskedKey = model.apiKey
    ? model.apiKey.slice(0, 6) + '...' + model.apiKey.slice(-4)
    : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2 overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 touch-none p-2 -m-2"
        >
          <GripVertical className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        <ProviderLogo providerId={model.providerId} size={18} />

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium truncate">{model.displayName}</p>
            {model.isPreset && (
              <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 leading-none">
                {t('settings.preset')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">
            {provider?.name} · {model.modelId}
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-2 -m-2"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          )}
        </button>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={model.enabled}
            onChange={() => toggleModel(model.id)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
        </label>

        {!model.isPreset && (
          <button
            onClick={() => removeModel(model.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 -m-2"
          >
            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded edit area */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {model.isPreset ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-blue-500 dark:text-blue-400">
                {t('settings.presetInfo')}
              </p>
              {model.creditsPerRound != null && process.env.NEXT_PUBLIC_SAAS_MODE === 'true' && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                  <Zap className="w-3 h-3" />
                  {model.creditsPerRound} credits / 轮
                </span>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.apiKey')}</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={model.apiKey}
                  onChange={(e) => updateModel(model.id, { apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full text-base sm:text-[11px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
          {!model.isPreset && (
            <div>
              <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.endpointUrl')}</label>
              <input
                type="text"
                value={model.baseUrl}
                onChange={(e) => updateModel(model.id, { baseUrl: e.target.value })}
                placeholder={provider?.defaultBaseUrl || 'https://...'}
                className="w-full text-base sm:text-[11px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.modelId')}</label>
              <input
                type="text"
                value={model.modelId}
                disabled={model.isPreset}
                onChange={(e) => updateModel(model.id, { modelId: e.target.value })}
                className="w-full text-base sm:text-[11px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.displayName')}</label>
              <input
                type="text"
                value={model.displayName}
                disabled={model.isPreset}
                onChange={(e) => updateModel(model.id, { displayName: e.target.value })}
                className="w-full text-base sm:text-[11px] rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
