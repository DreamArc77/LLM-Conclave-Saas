import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { LangFix } from '@/components/common/LangFix';
import { publishedVerdicts } from '@/lib/content';
import { ja } from '@/i18n/messages/ja';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const verdicts = await publishedVerdicts('ja');
  return pageMetadata({
    title: ja.verdicts.hubTitle,
    description: ja.verdicts.hubIntro,
    path: '/ja/verdicts',
    alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
    index: verdicts.length > 0,
  });
}

export default async function VerdictsPageJa() {
  const verdicts = await publishedVerdicts('ja');
  if (verdicts.length === 0) notFound();
  return (
    <>
      <LangFix lang="ja" />
      <VerdictsHub verdicts={verdicts} t={ja.verdicts} otherHref="/ja" />
    </>
  );
}
