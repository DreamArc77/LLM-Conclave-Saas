import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictArticle } from '@/components/verdicts/VerdictArticle';
import {
  getVerdict,
  isIndexable,
  listVerdicts,
  publishedVerdictSlugs,
  verdictLocales,
  VERDICTS_BASE,
} from '@/lib/content';
import type { HomeLocale } from '@/lib/seo';
import { en } from '@/i18n/messages/en';
import { pageMetadata } from '@/lib/content-seo';

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await publishedVerdictSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const verdict = await getVerdict('en', slug);
  if (!verdict) return {};

  const locales = await verdictLocales(slug);
  const alternates: Partial<Record<HomeLocale, string>> = {};
  for (const locale of locales) alternates[locale] = `${VERDICTS_BASE[locale]}/${slug}`;

  return pageMetadata({
    title: verdict.title,
    description: verdict.summary || verdict.title,
    path: `/verdicts/${slug}`,
    alternates,
    index: isIndexable(verdict.sample),
  });
}

export default async function VerdictPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const verdict = await getVerdict('en', slug);
  if (!verdict || verdict.sample) notFound();

  const related = (await listVerdicts('en')).filter((v) => v.slug !== slug).slice(0, 2);

  return (
    <VerdictArticle
      verdict={verdict}
      t={en.verdicts}
      related={related}
      hubHref={VERDICTS_BASE.en}
      hubLabel={en.verdicts.hubTitle}
    />
  );
}
