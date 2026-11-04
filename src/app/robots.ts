import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { predictionsDisabled } from '@/lib/content';

// Evaluated per request so the kill switch works without a rebuild.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/api/', '/app', '/account'];

  // Emergency kill switch: stop inviting crawlers into the sports section.
  if (predictionsDisabled()) {
    disallow.push('/predictions', '/zh/predictions', '/ja/predictions');
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
