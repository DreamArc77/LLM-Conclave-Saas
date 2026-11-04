import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictArticle } from '@/components/verdicts/VerdictArticle';
import { LangFix } from '@/components/common/LangFix';
import {
  getVerdict,
  isIndexable,
  listVerdicts,
  publishedVerdictSlugs,
  verdictLocales,
  VERDICTS_BASE,
} from '@/lib/content';
import type { HomeLocale } from '@/lib/seo';
import { zhCN } from '@/i18n/messages/zh-CN';
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
  const verdict = await getVerdict('zh', slug);
  if (!verdict) return {};

  const locales = await verdictLocales(slug);
  const alternates: Partial<Record<HomeLocale, string>> = {};
  for (const locale of locales) alternates[locale] = `${VERDICTS_BASE[locale]}/${slug}`;

  return pageMetadata({
    title: verdict.title,
    description: verdict.summary || verdict.title,
    path: `/zh/verdicts/${slug}`,
    alternates,
    index: isIndexable(verdict.sample),
  });
}

export default async function VerdictPageZh({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const verdict = await getVerdict('zh', slug);
  if (!verdict || verdict.sample) notFound();

  const related = (await listVerdicts('zh')).filter((v) => v.slug !== slug).slice(0, 2);

  return (
    <>
      <LangFix lang="zh-CN" />
      <VerdictArticle
        verdict={verdict}
        t={zhCN.verdicts}
        related={related}
        hubHref={VERDICTS_BASE.zh}
        hubLabel={zhCN.verdicts.hubTitle}
      />
    </>
  );
}
