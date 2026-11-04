import Link from 'next/link';
import type { HomeLocale } from '@/lib/seo';
import type { Verdict } from '@/lib/content';
import { VERDICTS_BASE } from '@/lib/content';
import type { Messages } from '@/i18n/messages/en';
import { VerdictCard } from '@/components/verdicts/VerdictCard';

export function HomeVerdicts({
  locale,
  verdicts,
  t,
}: {
  locale: HomeLocale;
  verdicts: Verdict[];
  t: Messages['verdicts'];
}) {
  const latest = verdicts.slice(0, 3);

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

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((verdict) => (
            <VerdictCard key={verdict.slug} verdict={verdict} t={t} />
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400">{t.disclaimer}</p>
      </div>
    </section>
  );
}
