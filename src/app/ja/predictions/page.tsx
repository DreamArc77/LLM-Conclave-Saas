import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { LangFix } from '@/components/common/LangFix';
import { publishedSports } from '@/lib/content';
import { ja } from '@/i18n/messages/ja';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const sports = await publishedSports('ja');
  return pageMetadata({
    title: ja.predictions.hubTitle,
    description: ja.predictions.hubIntro,
    path: '/ja/predictions',
    alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
    index: sports.length > 0,
  });
}

export default async function PredictionsPageJa() {
  const sports = await publishedSports('ja');
  if (sports.length === 0) notFound();
  return (
    <>
      <LangFix lang="ja" />
      <PredictionsHub locale="ja" t={ja.predictions} homeHref="/ja" availableSports={sports} />
    </>
  );
}
