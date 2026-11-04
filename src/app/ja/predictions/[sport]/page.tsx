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
import { ja } from '@/i18n/messages/ja';
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

  const slate = await getDaily(sport, 'ja');
  const weekly = await listWeekly(sport, 'ja');
  const hasReal = Boolean((slate && !slate.sample) || weekly.some((w) => !w.sample));

  return pageMetadata({
    title: `${ja.predictions.sports[sport]}予測 —— AIカウンシル`,
    description: ja.predictions.hubIntro,
    path: `/ja/predictions/${sport}`,
    alternates: {
      en: `/predictions/${sport}`,
      zh: `/zh/predictions/${sport}`,
      ja: `/ja/predictions/${sport}`,
    },
    index: hasReal && !predictionsDisabled(),
  });
}

export default async function SportPredictionsPageJa({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!isSport(sport)) notFound();
  if (!(await sportHasPublished('ja', sport))) notFound();

  const [slate, weekly] = await Promise.all([getDaily(sport, 'ja'), listWeekly(sport, 'ja')]);

  return (
    <>
      <LangFix lang="ja" />
      <SportPage locale="ja" sport={sport} t={ja.predictions} slate={slate} weekly={weekly} />
    </>
  );
}
