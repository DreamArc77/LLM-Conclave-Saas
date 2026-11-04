import Link from 'next/link';
import type { HomeLocale } from '@/lib/seo';
import type { Verdict } from '@/lib/content';
import { PREDICTIONS_BASE, VERDICTS_BASE } from '@/lib/content';
import type { Messages } from '@/i18n/messages/en';
import { VerdictCard } from '@/components/verdicts/VerdictCard';

export function HomeVerdicts({
  locale,
  verdicts,
  t,
  tp,
  showPredictions,
}: {
  locale: HomeLocale;
  verdicts: Verdict[];
  t: Messages['verdicts'];
  tp: Messages['predictions'];
  showPredictions: boolean;
}) {
  const latest = verdicts.slice(0, 3);
  const gridClass = showPredictions
    ? 'grid gap-5 md:grid-cols-2 lg:grid-cols-4'
    : 'grid gap-5 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section id="verdicts" className="border-t border-gray-100 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              {t.hubTitle}
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-gray-500">{t.hubIntro}</p>
          </div>
          <Link
            href={VERDICTS_BASE[locale]}
            className="text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
          >
            {t.backToHub} →
          </Link>
        </div>

        <div className={gridClass}>
          {latest.map((verdict) => (
            <VerdictCard key={verdict.slug} verdict={verdict} t={t} />
          ))}

          {showPredictions && (
            <Link
              href={PREDICTIONS_BASE[locale]}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-gradient-to-br from-cyan-50 to-purple-50 p-6 transition-all duration-300 hover:border-cyan-200 hover:shadow-[0_8px_30px_-4px_rgba(34,211,238,0.15)]"
            >
              <span className="text-2xl" aria-hidden="true">
                🏆
              </span>
              <h3 className="mt-3 text-lg font-bold text-gray-900 transition-colors group-hover:text-cyan-700">
                {tp.hubTitle}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{tp.hubIntro}</p>
              <span className="mt-auto pt-4 text-xs font-semibold text-cyan-600">
                {tp.openSport} →
              </span>
            </Link>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-400">{t.disclaimer}</p>
      </div>
    </section>
  );
}
