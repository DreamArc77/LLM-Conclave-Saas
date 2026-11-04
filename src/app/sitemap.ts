import type { MetadataRoute } from 'next';
import { SITE_URL, type HomeLocale } from '@/lib/seo';
import {
  allVerdictSlugs,
  getDaily,
  getVerdict,
  listWeekly,
  PREDICTIONS_BASE,
  predictionsDisabled,
  SPORTS,
  sportUrl,
  VERDICTS_BASE,
  verdictLocales,
  verdictUrl,
  weeklyLocales,
  weeklyUrl,
} from '@/lib/content';

const LOCALES: HomeLocale[] = ['en', 'zh', 'ja'];
const HREFLANG: Record<HomeLocale, string> = { en: 'en', zh: 'zh-CN', ja: 'ja' };

/** How many recent weekly prediction pages per sport stay in the sitemap. */
const WEEKLY_SITEMAP_LIMIT = 8;

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

  /* --- Verdicts --- */
  for (const locale of LOCALES) {
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

  /* --- Predictions (skipped entirely by the kill switch) --- */
  if (!predictionsDisabled()) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}${PREDICTIONS_BASE[locale]}`,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    for (const sport of SPORTS) {
      const altMap: Partial<Record<HomeLocale, string>> = {};
      for (const locale of LOCALES) altMap[locale] = sportUrl(locale, sport);

      for (const locale of LOCALES) {
        const slate = await getDaily(sport, locale);
        const weekly = await listWeekly(sport, locale);
        const hasReal = Boolean((slate && !slate.sample) || weekly.some((w) => !w.sample));
        if (!hasReal) continue;
        entries.push({
          url: `${SITE_URL}${sportUrl(locale, sport)}`,
          changeFrequency: 'daily',
          priority: 0.7,
          alternates: { languages: languages(altMap) },
        });
      }

      for (const locale of LOCALES) {
        const weekly = (await listWeekly(sport, locale))
          .filter((w) => !w.sample)
          .slice(0, WEEKLY_SITEMAP_LIMIT);

        for (const w of weekly) {
          const locales = await weeklyLocales(sport, w.period);
          const weeklyAlt: Partial<Record<HomeLocale, string>> = {};
          for (const l of locales) weeklyAlt[l] = weeklyUrl(l, sport, w.period);

          entries.push({
            url: `${SITE_URL}${weeklyUrl(locale, sport, w.period)}`,
            lastModified: w.updated || undefined,
            changeFrequency: 'weekly',
            priority: 0.5,
            alternates: { languages: languages(weeklyAlt) },
          });
        }
      }
    }
  }

  return entries;
}
