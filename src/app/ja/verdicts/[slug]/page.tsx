import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictArticle } from '@/components/verdicts/VerdictArticle';
import { LangFix } from '@/components/common/LangFix';
import {
  allVerdictSlugs,
  getVerdict,
  isIndexable,
  listVerdicts,
  verdictLocales,
  VERDICTS_BASE,
} from '@/lib/content';
import type { HomeLocale } from '@/lib/seo';
import { ja } from '@/i18n/messages/ja';
import { pageMetadata } from '@/lib/content-seo';

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await allVerdictSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const verdict = await getVerdict('ja', slug);
  if (!verdict) return {};

  const locales = await verdictLocales(slug);
  const alternates: Partial<Record<HomeLocale, string>> = {};
  for (const locale of locales) alternates[locale] = `${VERDICTS_BASE[locale]}/${slug}`;

  return pageMetadata({
    title: verdict.title,
    description: verdict.summary || verdict.title,
    path: `/ja/verdicts/${slug}`,
    alternates,
    index: isIndexable(verdict.sample),
  });
}

export default async function VerdictPageJa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const verdict = await getVerdict('ja', slug);
  if (!verdict) notFound();

  const related = (await listVerdicts('ja')).filter((v) => v.slug !== slug).slice(0, 2);

  return (
    <>
      <LangFix lang="ja" />
      <VerdictArticle
        verdict={verdict}
        t={ja.verdicts}
        related={related}
        hubHref={VERDICTS_BASE.ja}
        hubLabel={ja.verdicts.hubTitle}
      />
    </>
  );
}
