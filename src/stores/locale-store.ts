import { createStore, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Locale } from '@/i18n';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function isCapacitor(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /LLMConclaveCapacitor/i.test(navigator.userAgent) ||
    !!(window as any).Capacitor?.isNativePlatform?.()
  );
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh-CN';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('ja')) return 'ja';
  return 'en';
}

function getDefaultLocale(): Locale {
  if (isCapacitor()) return detectBrowserLocale();
  return 'zh-CN';
}

type StoreApi = ReturnType<typeof createLocaleStore>;

function createLocaleStore() {
  return createStore<LocaleStore>()(
    persist(
      (set) => ({
        locale: getDefaultLocale(),
        setLocale: (locale: Locale) => {
          set({ locale });
          if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
          }
        },
      }),
      {
        name: 'llmconclave-locale',
        storage: createJSONStorage(() =>
          typeof window !== 'undefined'
            ? window.localStorage
            : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        ),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          try {
            if (isCapacitor()) {
              state.locale = detectBrowserLocale();
            } else {
              const raw = localStorage.getItem('llmconclave-locale');
              const parsed = raw ? JSON.parse(raw) : null;
              if (!parsed?.state?.locale) {
                state.locale = detectBrowserLocale();
              }
            }
            document.documentElement.lang = state.locale;
          } catch {
            // localStorage may be unavailable
          }
        },
      }
    )
  );
}

// Lazy init: avoid calling Zustand's persist (which references window) at module
// evaluation time, so Turbopack SSR does not crash on window is not defined.
let _store: StoreApi | null = null;
function getStore(): StoreApi {
  if (!_store) _store = createLocaleStore();
  return _store;
}

export function useLocaleStore(): LocaleStore;
export function useLocaleStore<T>(selector: (state: LocaleStore) => T): T;
export function useLocaleStore<T>(selector?: (state: LocaleStore) => T): T | LocaleStore {
  return useStore(getStore(), selector as any) as any;
}

useLocaleStore.getState = (): LocaleStore => getStore().getState();
useLocaleStore.setState = (partial: Parameters<StoreApi['setState']>[0], replace?: boolean) => {
  getStore().setState(partial as any, replace as any);
};
