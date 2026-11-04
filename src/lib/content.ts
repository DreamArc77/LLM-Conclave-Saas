import { promises as fs } from 'fs';
import path from 'path';
import type { HomeLocale } from '@/lib/seo';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Filesystem directory name per URL locale. */
const LOCALE_DIR: Record<HomeLocale, string> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
};

export const VERDICTS_BASE: Record<HomeLocale, string> = {
  en: '/verdicts',
  zh: '/zh/verdicts',
  ja: '/ja/verdicts',
};

export interface Verdict {
  slug: string;
  locale: HomeLocale;
  title: string;
  summary: string;
  models: string[];
  rounds: number;
  date: string;
  sample: boolean;
  /** Raw markdown body. */
  body: string;
}

/* ------------------------------------------------------------------ */
/* Frontmatter parsing (strict subset: `key: value` lines)             */
/* ------------------------------------------------------------------ */

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toBool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function toInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

/* ------------------------------------------------------------------ */
/* Filesystem helpers                                                  */
/* ------------------------------------------------------------------ */

const CONTENT_ROOT = path.join(process.cwd(), 'content');

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function listDirSafe(dirPath: string): Promise<string[]> {
  try {
    return (await fs.readdir(dirPath)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Verdicts                                                            */
/* ------------------------------------------------------------------ */

function verdictPath(locale: HomeLocale, slug: string): string {
  return path.join(CONTENT_ROOT, 'verdicts', LOCALE_DIR[locale], `${slug}.md`);
}

async function parseVerdict(locale: HomeLocale, slug: string): Promise<Verdict | null> {
  const raw = await readFileSafe(verdictPath(locale, slug));
  if (raw == null) return null;
  const { data, body } = parseFrontmatter(raw);
  return {
    slug,
    locale,
    title: data.title ?? slug,
    summary: data.summary ?? '',
    models: splitList(data.models),
    rounds: toInt(data.rounds, 3),
    date: data.date ?? '',
    sample: toBool(data.sample),
    body,
  };
}

export async function getVerdict(locale: HomeLocale, slug: string): Promise<Verdict | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return parseVerdict(locale, slug);
}

export async function listVerdicts(locale: HomeLocale): Promise<Verdict[]> {
  const files = await listDirSafe(path.join(CONTENT_ROOT, 'verdicts', LOCALE_DIR[locale]));
  const verdicts = await Promise.all(
    files.map((f) => parseVerdict(locale, f.replace(/\.md$/, '')))
  );
  return verdicts
    .filter((v): v is Verdict => v !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}

/** Which locales actually have this verdict (drives hreflang). */
export async function verdictLocales(slug: string): Promise<HomeLocale[]> {
  const locales: HomeLocale[] = ['en', 'zh', 'ja'];
  const results = await Promise.all(
    locales.map(async (locale) => ((await parseVerdict(locale, slug)) ? locale : null))
  );
  return results.filter((l): l is HomeLocale => l !== null);
}

export async function allVerdictSlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  for (const locale of ['en', 'zh', 'ja'] as HomeLocale[]) {
    const files = await listDirSafe(path.join(CONTENT_ROOT, 'verdicts', LOCALE_DIR[locale]));
    for (const f of files) slugs.add(f.replace(/\.md$/, ''));
  }
  return [...slugs].sort();
}

/** Slugs that have at least one published (non-sample) file in any locale. */
export async function publishedVerdictSlugs(): Promise<string[]> {
  const out: string[] = [];
  for (const slug of await allVerdictSlugs()) {
    const locales = await verdictLocales(slug);
    for (const locale of locales) {
      const verdict = await getVerdict(locale, slug);
      if (verdict && !verdict.sample) {
        out.push(slug);
        break;
      }
    }
  }
  return out;
}

/**
 * Public listing: samples are staging artifacts and must never be shown
 * publicly. A hub only exists once it has real (non-sample) content.
 */
export async function publishedVerdicts(locale: HomeLocale): Promise<Verdict[]> {
  return (await listVerdicts(locale)).filter((v) => !v.sample);
}

export function verdictUrl(locale: HomeLocale, slug: string): string {
  return `${VERDICTS_BASE[locale]}/${slug}`;
}

/** A page has real (non-sample) content and may be indexed. */
export function isIndexable(sample: boolean): boolean {
  return !sample;
}
