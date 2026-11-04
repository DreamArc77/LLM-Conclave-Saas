import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { listVerdicts } from '@/lib/content';
import { en } from '@/i18n/messages/en';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: 'AI Council Verdicts — Multi-AI Debates on Real Decisions',
  description:
    'Evergreen high-stakes decisions debated by a council of frontier AI models. Structured verdicts on investing, startups, careers and technology.',
  path: '/verdicts',
  alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
  index: true,
});

export default async function VerdictsPage() {
  const verdicts = await listVerdicts('en');
  return <VerdictsHub verdicts={verdicts} t={en.verdicts} otherHref="/" />;
}
