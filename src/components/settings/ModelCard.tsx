'use client';

import { useState } from'react';
import { useSortable } from'@dnd-kit/sortable';
import { CSS } from'@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Zap } from'lucide-react';
import { ModelLogo } from'@/components/common/ModelLogo';
import { useConfigStore } from'@/stores/config-store';
import { PROVIDER_REGISTRY } from'@/lib/providers/registry';
import type { ModelConfig } from'@/types/config';
import { useT } from'@/hooks/useT';

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
 ? model.apiKey.slice(0, 6) +'...'+ model.apiKey.slice(-4)
 :'';

 return (
 <div
 ref={setNodeRef}
 style={style}
 className="bg-white border border-[#E5E0D8] rounded-lg mb-2 overflow-hidden"
 >
 {/* Header row */}
 <div className="flex items-center gap-2 px-3 py-2.5">
 <button
 {...attributes}
 {...listeners}
 className="cursor-grab text-[#5D5C5A] hover:text-gray-600 touch-none p-2 -m-2"
 >
 <GripVertical className="w-5 h-5 sm:w-4 sm:h-4"/>
 </button>

 <ModelLogo modelId={model.modelId} displayName={model.displayName} size={18} />

 <div
 className="flex-1 min-w-0 cursor-pointer"
 onClick={() => setExpanded(!expanded)}
 >
 <div className="flex items-center gap-1.5 flex-wrap">
 <p className="text-sm font-medium truncate">{model.displayName}</p>
 {model.isPreset && model.badge && (
 <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none">
 {model.badge}
 </span>
 )}
 {model.isPreset && model.creditsPerRound != null && process.env.NEXT_PUBLIC_SAAS_MODE ==='true'&& (
 <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 leading-none">
 <Zap className="w-2.5 h-2.5"/>
 {model.creditsPerRound}cr
 </span>
 )}
 </div>
 <p className="text-xs text-[#5D5C5A] truncate">
 {provider?.name} · {model.modelId}
 </p>
 </div>

 <button
 onClick={() => setExpanded(!expanded)}
 className="text-[#5D5C5A] hover:text-gray-600 p-2 -m-2"
 >
 {expanded ? (
 <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5"/>
 ) : (
 <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5"/>
 )}
 </button>

 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={model.enabled}
 onChange={() => toggleModel(model.id)}
 className="sr-only peer"
 />
 <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"/>
 </label>

 {!model.isPreset && (
 <button
 onClick={() => removeModel(model.id)}
 className="text-[#5D5C5A] hover:text-red-500 transition-colors p-2 -m-2"
 >
 <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5"/>
 </button>
 )}
 </div>

 {/* Expanded edit area */}
 {expanded && (
 <div className="px-3 pb-3 pt-1 border-t border-[#E5E0D8] space-y-2">
 {model.isPreset ? (
 <p className="text-[10px] text-blue-500">
 {t('settings.presetInfo')}
 </p>
 ) : (
 <div>
 <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.apiKey')}</label>
 <div className="relative">
 <input
 type={showKey ?'text':'password'}
 value={model.apiKey}
 onChange={(e) => updateModel(model.id, { apiKey: e.target.value })}
 placeholder="sk-..."
 className="w-full text-base sm:text-[11px] rounded border border-[#E5E0D8] bg-white px-2 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 <button
 type="button"
 onClick={() => setShowKey(!showKey)}
 className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5D5C5A] hover:text-gray-600"
 >
 {showKey ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
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
 placeholder={provider?.defaultBaseUrl ||'https://...'}
 className="w-full text-base sm:text-[11px] rounded border border-[#E5E0D8] bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
 className="w-full text-base sm:text-[11px] rounded border border-[#E5E0D8] bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
 />
 </div>
 <div className="flex-1">
 <label className="text-[10px] text-gray-500 mb-0.5 block">{t('settings.displayName')}</label>
 <input
 type="text"
 value={model.displayName}
 disabled={model.isPreset}
 onChange={(e) => updateModel(model.id, { displayName: e.target.value })}
 className="w-full text-base sm:text-[11px] rounded border border-[#E5E0D8] bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
 />
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
