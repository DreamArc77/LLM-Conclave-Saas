import type { Messages } from '@/i18n/messages/en';
import { SITE_URL } from '@/lib/seo';

type HomeMessages = Messages['home'];

/**
 * Server-rendered JSON-LD: Organization + WebApplication + FAQPage.
 * "<" is escaped so user copy can never close the script tag early.
 */
export function JsonLd({ t }: { t: HomeMessages }) {
  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LLM Conclave',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo-transparent.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'LLM Conclave',
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: t.hero.subtitle,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  const json = JSON.stringify(graph).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
