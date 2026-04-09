'use client';

import { useState, useEffect } from'react';
import { X } from'lucide-react';
import { useUIStore } from'@/stores/ui-store';
import { useConfigStore } from'@/stores/config-store';
import { ModelList } from'./ModelList';
import { AddModelDialog } from'./AddModelDialog';
import { useT } from'@/hooks/useT';
import { MAX_ROUNDS_HARD_LIMIT } from'@/config/credit-packages';
import { ALLOW_CUSTOM_MODELS } from'@/config/feature-flags';

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
 className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-white border-l border-[#E5E0D8] z-50 transform transition-transform duration-300 ${
 settingsOpen ?'translate-x-0':'translate-x-full'
 }`}
 >
 <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8]">
 <h2 className="text-base font-semibold">{t('settings.title')}</h2>
 <button
 onClick={closeSettings}
 className="text-[#5D5C5A] hover:text-gray-600"
 >
 <X className="w-5 h-5"/>
 </button>
 </div>

 <div className="overflow-y-auto h-[calc(100%-49px)] px-4 py-3">
 <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E5E0D8]">
 <label className="text-sm text-gray-600">{t('settings.maxRounds')}</label>
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
 className="w-14 text-center border border-[#E5E0D8] rounded px-2 py-0.5 text-base sm:text-sm bg-white text-[#111111] focus:outline-none focus:ring-1 focus:ring-blue-500"
 />
 </div>

 <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E5E0D8]">
 <label className="text-sm text-gray-600">{t('settings.exportFormat')}</label>
 <div className="flex rounded overflow-hidden border border-[#E5E0D8] text-xs font-medium">
 {(['pdf','png'] as const).map((fmt) => (
 <button
 key={fmt}
 onClick={() => setExportFormat(fmt)}
 className={`px-3 py-1 uppercase transition-colors ${
 exportFormat === fmt
 ?'bg-blue-500 text-[#111111]'
 :'bg-white text-gray-600 hover:bg-white'
 }`}
 >
 {fmt}
 </button>
 ))}
 </div>
 </div>

 <p className="text-xs text-[#5D5C5A] mb-3">{t('settings.instruction')}</p>

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
