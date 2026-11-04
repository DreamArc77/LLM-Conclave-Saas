import Link from 'next/link';
import { marked } from 'marked';
import type { HomeLocale } from '@/lib/seo';
import type { DailySlate, Sport, WeeklyPrediction } from '@/lib/content';
import { PREDICTIONS_BASE, weeklyUrl } from '@/lib/content';
import { interpolate } from '@/i18n';
import type { Messages } from '@/i18n/messages/en';

type PredictionsMessages = Messages['predictions'];

export async function SportPage({
  locale,
  sport,
  t,
  slate,
  weekly,
}: {
  locale: HomeLocale;
  sport: Sport;
  t: PredictionsMessages;
  slate: DailySlate | null;
  weekly: WeeklyPrediction[];
}) {
  const slateHtml = slate ? await marked.parse(slate.body) : null;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <Link
          href={PREDICTIONS_BASE[locale]}
          className="text-sm font-medium text-gray-500 transition-colors hover:text-cyan-600"
        >
          ← {t.backToHub}
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.sports[sport]}</h1>
          <p className="mt-3 text-gray-600">{t.hubIntro}</p>
        </header>

        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{t.latestSlate}</h2>
            {slate?.sample && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {t.sampleBadge}
              </span>
            )}
            {slate?.updated && (
              <span className="text-xs text-gray-400">
                {interpolate(t.updatedOn, { date: slate.updated })}
              </span>
            )}
          </div>
          {slateHtml ? (
            <div className="prose-lc mt-4" dangerouslySetInnerHTML={{ __html: slateHtml }} />
          ) : (
            <p className="mt-4 text-sm text-gray-500">{t.noSlate}</p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900">{t.weeklyTitle}</h2>
          {weekly.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">{t.noWeekly}</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {weekly.map((w) => (
                <li key={w.period}>
                  <Link
                    href={weeklyUrl(locale, sport, w.period)}
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      {w.title}
                      {w.sample && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {t.sampleBadge}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {interpolate(t.updatedOn, { date: w.updated })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-8 text-white">
          <h2 className="text-xl font-bold">{t.ctaTitle}</h2>
          <p className="mt-2 text-sm text-white/90">{t.ctaDesc}</p>
          <Link
            href="/auth/signup"
            className="mt-5 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-cyan-700 transition-colors hover:bg-cyan-50"
          >
            {t.ctaButton}
          </Link>
        </section>

        <p className="mt-10 text-xs text-gray-400">{t.disclaimer}</p>
      </div>
    </main>
  );
}
