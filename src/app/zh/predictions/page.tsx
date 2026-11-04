import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { LangFix } from '@/components/common/LangFix';
import { publishedSports } from '@/lib/content';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const sports = await publishedSports('zh');
  return pageMetadata({
    title: zhCN.predictions.hubTitle,
    description: zhCN.predictions.hubIntro,
    path: '/zh/predictions',
    alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
    index: sports.length > 0,
  });
}

export default async function PredictionsPageZh() {
  const sports = await publishedSports('zh');
  if (sports.length === 0) notFound();
  return (
    <>
      <LangFix lang="zh-CN" />
      <PredictionsHub locale="zh" t={zhCN.predictions} homeHref="/zh" availableSports={sports} />
    </>
  );
}
