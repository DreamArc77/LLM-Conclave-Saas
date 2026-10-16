import Link from 'next/link';
import type { Messages } from '@/i18n/messages/en';
import { LanguageSwitcher } from './LanguageSwitcher';

type HomeMessages = Messages['home'];

const LOCALE_HOME: Record<'en' | 'zh' | 'ja', string> = {
  en: '/',
  zh: '/zh',
  ja: '/ja',
};

export function HomeNavbar({ locale, t }: { locale: 'en' | 'zh' | 'ja'; t: HomeMessages }) {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 border-b border-gray-100 bg-white/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href={LOCALE_HOME[locale]} className="flex items-center gap-3 transition-colors">
          <img
            src="/images/logo-transparent.png"
            alt="LLM Conclave Logo"
            className="h-8 w-8 object-contain"
            width={32}
            height={32}
          />
          <span className="font-bold text-lg tracking-tight text-gray-900">LLM Conclave</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-cyan-600 transition-colors">{t.nav.features}</a>
          <a href="#how" className="hover:text-cyan-600 transition-colors">{t.nav.how}</a>
          <a href="#faq" className="hover:text-cyan-600 transition-colors">{t.nav.faq}</a>
          <a href="#about" className="hover:text-cyan-600 transition-colors">{t.nav.about}</a>
          <a href="#contact" className="hover:text-cyan-600 transition-colors">{t.nav.contact}</a>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link
            href="/auth/signup"
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 rounded-md transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)]"
          >
            {t.nav.cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}
