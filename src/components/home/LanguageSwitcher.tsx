import Link from 'next/link';

const LANGUAGES = [
  { locale: 'en' as const, href: '/', label: 'English' },
  { locale: 'zh' as const, href: '/zh', label: '中文' },
  { locale: 'ja' as const, href: '/ja', label: '日本語' },
];

export function LanguageSwitcher({ locale }: { locale: 'en' | 'zh' | 'ja' }) {
  return (
    <div
      className="hidden sm:flex items-center gap-2 text-xs font-medium"
      aria-label="Language switcher"
    >
      {LANGUAGES.map((lang, i) => (
        <span key={lang.locale} className="flex items-center gap-2">
          {i > 0 && <span className="text-gray-300" aria-hidden="true">|</span>}
          <Link
            href={lang.href}
            hrefLang={lang.locale}
            className={
              lang.locale === locale
                ? 'text-gray-900 font-bold'
                : 'text-gray-400 hover:text-cyan-600 transition-colors'
            }
            aria-current={lang.locale === locale ? 'true' : undefined}
          >
            {lang.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
