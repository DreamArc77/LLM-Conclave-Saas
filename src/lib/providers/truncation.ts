import type { Locale } from '@/i18n';

/** Normalizes provider-specific stop reasons that mean "hit the output cap". */
export function isTruncatedFinishReason(reason?: string | null): boolean {
  if (!reason) return false;
  const normalized = reason.toLowerCase();
  return (
    normalized === 'length' ||
    normalized === 'max_tokens' ||
    normalized === 'max_output_tokens' ||
    normalized === 'max_completion_tokens'
  );
}

/** Inline marker appended to user-visible content when a generation was cut off. */
export function truncationNote(locale: Locale): string {
  switch (locale) {
    case 'en':
      return '\n\n_[Output truncated by the model length limit.]_';
    case 'ja':
      return '\n\n_[出力が長さ上限に達したため、途中で切れています。]_';
    default:
      return '\n\n_[输出因长度上限被截断。]_';
  }
}

/** Marker for routes that do not know the request locale (e.g. meeting minutes). */
export function truncationNoteBilingual(): string {
  return '\n\n> ⚠️ 输出因长度上限被截断 / Output truncated by the model length limit.';
}
