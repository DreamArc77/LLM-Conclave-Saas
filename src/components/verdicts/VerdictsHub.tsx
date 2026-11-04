import Link from 'next/link';
import type { Verdict } from '@/lib/content';
import type { Messages } from '@/i18n/messages/en';
import { VerdictCard } from './VerdictCard';

type VerdictMessages = Messages['verdicts'];

export function VerdictsHub({
  verdicts,
  t,
  otherHref,
}: {
  verdicts: Verdict[];
  t: VerdictMessages;
  /** Locale home link — the hub is linked from the marketing navbar. */
  otherHref: string;
}) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="max-w-3xl">
          <Link
            href={otherHref}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-cyan-600"
          >
            ← LLM Conclave
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-5xl">{t.hubTitle}</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">{t.hubIntro}</p>
        </div>

        {verdicts.length === 0 ? (
          <p className="mt-12 text-gray-500">{t.noVerdicts}</p>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {verdicts.map((v) => (
              <VerdictCard key={v.slug} verdict={v} t={t} />
            ))}
          </div>
        )}

        <section className="mt-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-8 text-white">
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
