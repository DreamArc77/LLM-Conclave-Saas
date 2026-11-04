import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { LangFix } from '@/components/common/LangFix';
import { publishedVerdicts } from '@/lib/content';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const verdicts = await publishedVerdicts('zh');
  return pageMetadata({
    title: zhCN.verdicts.hubTitle,
    description: zhCN.verdicts.hubIntro,
    path: '/zh/verdicts',
    alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
    index: verdicts.length > 0,
  });
}

export default async function VerdictsPageZh() {
  const verdicts = await publishedVerdicts('zh');
  if (verdicts.length === 0) notFound();
  return (
    <>
      <LangFix lang="zh-CN" />
      <VerdictsHub verdicts={verdicts} t={zhCN.verdicts} otherHref="/zh" />
    </>
  );
}
