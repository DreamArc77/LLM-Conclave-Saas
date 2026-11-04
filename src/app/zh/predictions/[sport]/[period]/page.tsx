import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { WeeklyPage } from '@/components/predictions/WeeklyPage';
import { LangFix } from '@/components/common/LangFix';
import {
  allWeekly,
  getWeekly,
  isIndexable,
  predictionsDisabled,
  PREDICTIONS_BASE,
  SPORTS,
  weeklyLocales,
  type Sport,
} from '@/lib/content';
import type { HomeLocale } from '@/lib/seo';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: Array<{ sport: string; period: string }> = [];
  for (const sport of SPORTS) {
    const periods = new Set((await allWeekly(sport)).map((w) => w.period));
    for (const period of periods) params.push({ sport, period });
  }
  return params;
}

function isSport(value: string): value is Sport {
  return (SPORTS as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; period: string }>;
}): Promise<Metadata> {
  const { sport, period } = await params;
  if (!isSport(sport)) return {};

  const weekly = await getWeekly(sport, period, 'zh');
  if (!weekly) return {};

  const locales = await weeklyLocales(sport, period);
  const alternates: Partial<Record<HomeLocale, string>> = {};
  for (const locale of locales) {
    alternates[locale] = `${PREDICTIONS_BASE[locale]}/${sport}/${period}`;
  }

  return pageMetadata({
    title: weekly.title,
    description: weekly.summary || weekly.title,
    path: `/zh/predictions/${sport}/${period}`,
    alternates,
    index: isIndexable(weekly.sample) && !predictionsDisabled(),
  });
}

export default async function WeeklyPredictionPageZh({
  params,
}: {
  params: Promise<{ sport: string; period: string }>;
}) {
  const { sport, period } = await params;
  if (!isSport(sport)) notFound();

  const weekly = await getWeekly(sport, period, 'zh');
  if (!weekly) notFound();

  return (
    <>
      <LangFix lang="zh-CN" />
      <WeeklyPage locale="zh" sport={sport} t={zhCN.predictions} weekly={weekly} />
    </>
  );
}
