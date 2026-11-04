import type { Metadata } from 'next';
import { SITE_URL, type HomeLocale } from '@/lib/seo';

const HREFLANG: Record<HomeLocale, string> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
};

/**
 * Metadata for content pages (verdicts).
 * `alternates` maps each locale that actually has the page to its path —
 * locales without content are excluded from hreflang.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  alternates?: Partial<Record<HomeLocale, string>>;
  index: boolean;
}): Metadata {
  const languages: Record<string, string> = {};
  if (opts.alternates) {
    for (const locale of ['en', 'zh', 'ja'] as HomeLocale[]) {
      const path = opts.alternates[locale];
      if (path) languages[HREFLANG[locale]] = path;
    }
    if (opts.alternates.en) languages['x-default'] = opts.alternates.en;
  }

  return {
    title: opts.title,
    description: opts.description,
    alternates: opts.alternates
      ? { canonical: opts.path, languages }
      : { canonical: opts.path },
    robots: opts.index ? undefined : { index: false, follow: false },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}${opts.path}`,
      siteName: 'LLM Conclave',
      type: 'article',
      images: [`${SITE_URL}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  };
}
