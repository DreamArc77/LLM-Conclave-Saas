import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/i18n';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh-CN';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('ja')) return 'ja';
  return 'en';
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'zh-CN' as Locale,
      setLocale: (locale: Locale) => {
        set({ locale });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
        }
      },
    }),
    {
      name: 'llmconclave-locale',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          const raw = localStorage.getItem('llmconclave-locale');
          const parsed = raw ? JSON.parse(raw) : null;
          // If no locale was stored (first visit), auto-detect from browser
          if (!parsed?.state?.locale) {
            state.locale = detectBrowserLocale();
          }
          // Sync HTML lang attribute
          document.documentElement.lang = state.locale;
        } catch {
          // localStorage may be unavailable (private browsing edge cases)
        }
      },
    }
  )
);
