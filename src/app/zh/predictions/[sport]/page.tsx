import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SportPage } from '@/components/predictions/SportPage';
import { LangFix } from '@/components/common/LangFix';
import {
  getDaily,
  listWeekly,
  predictionsDisabled,
  sportHasPublished,
  SPORTS,
  type Sport,
} from '@/lib/content';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return SPORTS.map((sport) => ({ sport }));
}

function isSport(value: string): value is Sport {
  return (SPORTS as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  if (!isSport(sport)) return {};

  const slate = await getDaily(sport, 'zh');
  const weekly = await listWeekly(sport, 'zh');
  const hasReal = Boolean((slate && !slate.sample) || weekly.some((w) => !w.sample));

  return pageMetadata({
    title: `${zhCN.predictions.sports[sport]} 预测 —— AI 议会`,
    description: zhCN.predictions.hubIntro,
    path: `/zh/predictions/${sport}`,
    alternates: {
      en: `/predictions/${sport}`,
      zh: `/zh/predictions/${sport}`,
      ja: `/ja/predictions/${sport}`,
    },
    index: hasReal && !predictionsDisabled(),
  });
}

export default async function SportPredictionsPageZh({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!isSport(sport)) notFound();
  if (!(await sportHasPublished('zh', sport))) notFound();

  const [slate, weekly] = await Promise.all([getDaily(sport, 'zh'), listWeekly(sport, 'zh')]);

  return (
    <>
      <LangFix lang="zh-CN" />
      <SportPage locale="zh" sport={sport} t={zhCN.predictions} slate={slate} weekly={weekly} />
    </>
  );
}
