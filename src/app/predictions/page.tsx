import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { en } from '@/i18n/messages/en';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: 'AI Council Predictions — NBA, Football, Esports, Keirin',
  description:
    'Match predictions debated in rounds by a council of frontier AI models. One page per sport, refreshed with new slates — with the consensus and the dissent preserved.',
  path: '/predictions',
  alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
  index: true,
});

export default function PredictionsPage() {
  return <PredictionsHub locale="en" t={en.predictions} homeHref="/" />;
}
