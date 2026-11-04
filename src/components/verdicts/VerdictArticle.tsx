import Link from 'next/link';
import { marked } from 'marked';
import type { Verdict } from '@/lib/content';
import { SITE_URL } from '@/lib/seo';
import { interpolate } from '@/i18n';
import type { Messages } from '@/i18n/messages/en';
import { VerdictCard } from './VerdictCard';

type VerdictMessages = Messages['verdicts'];

export async function VerdictArticle({
  verdict,
  t,
  related,
  hubHref,
  hubLabel,
}: {
  verdict: Verdict;
  t: VerdictMessages;
  related: Verdict[];
  hubHref: string;
  hubLabel: string;
}) {
  const bodyHtml = await marked.parse(verdict.body);
  const canonical = `${SITE_URL}${hubHref}/${verdict.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: verdict.title,
      description: verdict.summary,
      datePublished: verdict.date || undefined,
      inLanguage: verdict.locale === 'zh' ? 'zh-CN' : verdict.locale,
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'LLM Conclave', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'LLM Conclave', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LLM Conclave', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: hubLabel, item: `${SITE_URL}${hubHref}` },
        { '@type': 'ListItem', position: 3, name: verdict.title, item: canonical },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-12">
        <Link
          href={hubHref}
          className="text-sm font-medium text-gray-500 transition-colors hover:text-cyan-600"
        >
          ← {t.backToHub}
        </Link>

        <header className="mb-10 mt-8">
          {verdict.sample && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {t.sampleBadge}
            </div>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl">
            {verdict.title}
          </h1>
          {verdict.summary && (
            <p className="mt-4 text-lg leading-relaxed text-gray-600">{verdict.summary}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            {verdict.models.map((model) => (
              <span
                key={model}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-600"
              >
                {model}
              </span>
            ))}
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-500">
              {interpolate(t.roundsLabel, { count: String(verdict.rounds) })}
            </span>
            {verdict.date && (
              <span className="text-gray-400">{interpolate(t.debatedOn, { date: verdict.date })}</span>
            )}
          </div>
        </header>

        <div className="prose-lc" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

        <section className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-base font-bold text-gray-900">{t.methodologyTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {interpolate(t.methodologyDesc, {
              count: String(verdict.models.length || 4),
              rounds: String(verdict.rounds),
            })}
          </p>
          <p className="mt-3 text-xs text-gray-400">{t.disclaimer}</p>
        </section>

        <section className="mt-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-8 text-white">
          <h2 className="text-xl font-bold">{t.ctaTitle}</h2>
          <p className="mt-2 text-sm text-white/90">{t.ctaDesc}</p>
          <Link
            href="/auth/signup"
            className="mt-5 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-cyan-700 transition-colors hover:bg-cyan-50"
          >
            {t.ctaButton}
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-lg font-bold text-gray-900">{t.relatedTitle}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <VerdictCard key={r.slug} verdict={r} t={t} />
              ))}
            </div>
          </section>
        )}
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </main>
  );
}
