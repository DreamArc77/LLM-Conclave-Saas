'use client';

import { useLocaleStore } from '@/stores/locale-store';
import { getMessages, interpolate } from '@/i18n';

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const msgs = getMessages(locale);

  return function t(
    path: string,
    params?: Record<string, string | number>
  ): string {
    const keys = path.split('.');
    let value: unknown = msgs;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }
    if (typeof value !== 'string') return path;
    return params ? interpolate(value, params) : value;
  };
}
