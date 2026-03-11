import { en, type Messages } from './messages/en';
import { zhCN } from './messages/zh-CN';
import { ja } from './messages/ja';

export type Locale = 'en' | 'zh-CN' | 'ja';
export type { Messages };

export function getMessages(locale: Locale): Messages {
  switch (locale) {
    case 'en': return en;
    case 'zh-CN': return zhCN;
    case 'ja': return ja;
    default: return en;
  }
}

export function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(params[key] ?? `{${key}}`)
  );
}
