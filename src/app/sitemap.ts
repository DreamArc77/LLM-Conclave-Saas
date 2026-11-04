import type { MetadataRoute } from 'next';
import { SITE_URL, type HomeLocale } from '@/lib/seo';
import {
  allVerdictSlugs,
  getVerdict,
  publishedVerdicts,
  VERDICTS_BASE,
  verdictLocales,
  verdictUrl,
} from '@/lib/content';

const LOCALES: HomeLocale[] = ['en', 'zh', 'ja'];
const HREFLANG: Record<HomeLocale, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

// Built at deploy time from content/*.md. Kept static on purpose: the
// standalone runtime image does not ship the content/ directory, so runtime
// reads would silently drop entries. New content ships via a new deploy.

function languages(map: Partial<Record<HomeLocale, string>>) {
  const out: Record<string, string> = {};
  for (const locale of LOCALES) {
    const path = map[locale];
    if (path) out[HREFLANG[locale]] = `${SITE_URL}${path}`;
  }
  if (map.en) out['x-default'] = `${SITE_URL}${map.en}`;
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/zh`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/ja`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  /* --- Verdicts (hubs only exist once real content is published) --- */
  for (const locale of LOCALES) {
    const published = await publishedVerdicts(locale);
    if (published.length === 0) continue;
    entries.push({
      url: `${SITE_URL}${VERDICTS_BASE[locale]}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const slug of await allVerdictSlugs()) {
    const locales = await verdictLocales(slug);
    const altMap: Partial<Record<HomeLocale, string>> = {};
    for (const locale of locales) altMap[locale] = verdictUrl(locale, slug);

    for (const locale of locales) {
      const verdict = await getVerdict(locale, slug);
      if (!verdict || verdict.sample) continue;
      entries.push({
        url: `${SITE_URL}${verdictUrl(locale, slug)}`,
        lastModified: verdict.date || undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: { languages: languages(altMap) },
      });
    }
  }

  return entries;
}
