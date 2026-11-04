import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { publishedVerdicts } from '@/lib/content';
import { en } from '@/i18n/messages/en';
import { pageMetadata } from '@/lib/content-seo';

export async function generateMetadata(): Promise<Metadata> {
  const verdicts = await publishedVerdicts('en');
  return pageMetadata({
    title: 'AI Council Verdicts — Multi-AI Debates on Real Decisions',
    description:
      'Evergreen high-stakes decisions debated by a council of frontier AI models. Structured verdicts on investing, startups, careers and technology.',
    path: '/verdicts',
    alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
    index: verdicts.length > 0,
  });
}

export default async function VerdictsPage() {
  const verdicts = await publishedVerdicts('en');
  if (verdicts.length === 0) notFound();
  return <VerdictsHub verdicts={verdicts} t={en.verdicts} otherHref="/" />;
}
