'use client';

import { useLocaleStore } from'@/stores/locale-store';
import type { Locale } from'@/i18n';

const LOCALES: { value: Locale; label: string }[] = [
 { value:'en', label:'EN'},
 { value:'zh-CN', label:'中文'},
 { value:'ja', label:'日本語'},
];

export function LanguageSwitcher() {
 const locale = useLocaleStore((s) => s.locale);
 const setLocale = useLocaleStore((s) => s.setLocale);

 return (
 <div className="flex items-center rounded overflow-hidden border border-[#E5E0D8] text-[11px] font-medium">
 {LOCALES.map(({ value, label }) => (
 <button
 key={value}
 onClick={() => setLocale(value)}
 className={`px-2 py-0.5 transition-colors ${
 locale === value
 ?'bg-blue-500 text-[#111111]'
 :'text-gray-500 hover:bg-[#FAFAFA]'
 }`}
 >
 {label}
 </button>
 ))}
 </div>
 );
}
