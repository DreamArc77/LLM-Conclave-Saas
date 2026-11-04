import Link from 'next/link';
import { marked } from 'marked';
import type { HomeLocale } from '@/lib/seo';
import type { Sport, WeeklyPrediction } from '@/lib/content';
import { sportUrl } from '@/lib/content';
import { interpolate } from '@/i18n';
import type { Messages } from '@/i18n/messages/en';

type PredictionsMessages = Messages['predictions'];

export async function WeeklyPage({
  locale,
  sport,
  t,
  weekly,
}: {
  locale: HomeLocale;
  sport: Sport;
  t: PredictionsMessages;
  weekly: WeeklyPrediction;
}) {
  const bodyHtml = await marked.parse(weekly.body);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-12">
        <Link
          href={sportUrl(locale, sport)}
          className="text-sm font-medium text-gray-500 transition-colors hover:text-cyan-600"
        >
          ← {t.sports[sport]}
        </Link>

        <header className="mb-10 mt-8">
          {weekly.sample && (
            <div className="mb-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {t.sampleBadge}
            </div>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {weekly.title}
          </h1>
          {weekly.summary && (
            <p className="mt-4 text-lg leading-relaxed text-gray-600">{weekly.summary}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            {weekly.models.map((model) => (
              <span
                key={model}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-600"
              >
                {model}
              </span>
            ))}
            {weekly.updated && (
              <span className="text-gray-400">{interpolate(t.updatedOn, { date: weekly.updated })}</span>
            )}
          </div>
        </header>

        <div className="prose-lc" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

        <p className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
          {t.disclaimer}
        </p>
      </article>
    </main>
  );
}
