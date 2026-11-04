import Link from 'next/link';
import type { Verdict } from '@/lib/content';
import { verdictUrl } from '@/lib/content';
import { interpolate } from '@/i18n';
import type { Messages } from '@/i18n/messages/en';

type VerdictMessages = Messages['verdicts'];

export function VerdictCard({
  verdict,
  t,
}: {
  verdict: Verdict;
  t: VerdictMessages;
}) {
  return (
    <Link
      href={verdictUrl(verdict.locale, verdict.slug)}
      className="group block rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-cyan-200 hover:shadow-[0_8px_30px_-4px_rgba(34,211,238,0.12)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        {verdict.sample && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
            {t.sampleBadge}
          </span>
        )}
        {verdict.date && <span>{interpolate(t.debatedOn, { date: verdict.date })}</span>}
        <span aria-hidden="true">·</span>
        <span>{interpolate(t.roundsLabel, { count: String(verdict.rounds) })}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-cyan-700">
        {verdict.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{verdict.summary}</p>
      {verdict.models.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">{verdict.models.join(' · ')}</p>
      )}
    </Link>
  );
}
