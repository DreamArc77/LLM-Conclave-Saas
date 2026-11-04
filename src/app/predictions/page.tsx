import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { publishedSports } from '@/lib/content';
import { en } from '@/i18n/messages/en';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const sports = await publishedSports('en');
  return pageMetadata({
    title: 'AI Council Predictions — NBA, Football, Esports, Keirin',
    description:
      'Match predictions debated in rounds by a council of frontier AI models. One page per sport, refreshed with new slates — with the consensus and the dissent preserved.',
    path: '/predictions',
    alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
    index: sports.length > 0,
  });
}

export default async function PredictionsPage() {
  const sports = await publishedSports('en');
  if (sports.length === 0) notFound();
  return <PredictionsHub locale="en" t={en.predictions} homeHref="/" availableSports={sports} />;
}
