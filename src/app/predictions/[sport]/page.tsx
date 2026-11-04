import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SportPage } from '@/components/predictions/SportPage';
import {
  getDaily,
  listWeekly,
  predictionsDisabled,
  SPORTS,
  type Sport,
} from '@/lib/content';
import { en } from '@/i18n/messages/en';
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

  const slate = await getDaily(sport, 'en');
  const weekly = await listWeekly(sport, 'en');
  const hasReal = Boolean((slate && !slate.sample) || weekly.some((w) => !w.sample));

  return pageMetadata({
    title: `${en.predictions.sports[sport]} Predictions — AI Council`,
    description: en.predictions.hubIntro,
    path: `/predictions/${sport}`,
    alternates: {
      en: `/predictions/${sport}`,
      zh: `/zh/predictions/${sport}`,
      ja: `/ja/predictions/${sport}`,
    },
    index: hasReal && !predictionsDisabled(),
  });
}

export default async function SportPredictionsPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  if (!isSport(sport)) notFound();

  const [slate, weekly] = await Promise.all([getDaily(sport, 'en'), listWeekly(sport, 'en')]);

  return <SportPage locale="en" sport={sport} t={en.predictions} slate={slate} weekly={weekly} />;
}
