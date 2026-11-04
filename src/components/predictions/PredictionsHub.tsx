import Link from 'next/link';
import type { HomeLocale } from '@/lib/seo';
import { PREDICTIONS_BASE, sportUrl, type Sport } from '@/lib/content';
import type { Messages } from '@/i18n/messages/en';

type PredictionsMessages = Messages['predictions'];

const SPORT_EMOJI: Record<string, string> = {
  nba: '🏀',
  football: '⚽',
  esports: '🎮',
  keirin: '🚴',
};

export function PredictionsHub({
  locale,
  t,
  homeHref,
  availableSports,
}: {
  locale: HomeLocale;
  t: PredictionsMessages;
  homeHref: string;
  availableSports: Sport[];
}) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <Link
          href={homeHref}
          className="text-sm font-medium text-gray-500 transition-colors hover:text-cyan-600"
        >
          ← LLM Conclave
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl">{t.hubTitle}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">{t.hubIntro}</p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {availableSports.map((sport) => (
            <Link
              key={sport}
              href={sportUrl(locale, sport)}
              className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-cyan-200 hover:shadow-[0_8px_30px_-4px_rgba(34,211,238,0.12)]"
            >
              <div>
                <div className="text-3xl" aria-hidden="true">
                  {SPORT_EMOJI[sport]}
                </div>
                <h2 className="mt-3 text-lg font-bold text-gray-900 transition-colors group-hover:text-cyan-700">
                  {t.sports[sport]}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t.openSport} →</p>
              </div>
              <span className="text-2xl text-gray-300 transition-colors group-hover:text-cyan-400" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-xs text-gray-400">{t.disclaimer}</p>
        <p className="mt-1 text-xs text-gray-400">{PREDICTIONS_BASE[locale]}</p>
      </div>
    </main>
  );
}
