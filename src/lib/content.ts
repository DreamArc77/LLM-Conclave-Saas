import { promises as fs } from 'fs';
import path from 'path';
import type { HomeLocale } from '@/lib/seo';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Sport = 'nba' | 'football' | 'esports' | 'keirin';

export const SPORTS: Sport[] = ['nba', 'football', 'esports', 'keirin'];

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

export const PREDICTIONS_BASE: Record<HomeLocale, string> = {
  en: '/predictions',
  zh: '/zh/predictions',
  ja: '/ja/predictions',
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
  /** Rendered markdown body. */
  body: string;
}

export interface WeeklyPrediction {
  sport: Sport;
  period: string;
  locale: HomeLocale;
  title: string;
  summary: string;
  models: string[];
  rounds: number;
  updated: string;
  sample: boolean;
  body: string;
}

export interface DailySlate {
  sport: Sport;
  locale: HomeLocale;
  date: string;
  updated: string;
  sample: boolean;
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

async function listSubdirsSafe(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
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

export function verdictUrl(locale: HomeLocale, slug: string): string {
  return `${VERDICTS_BASE[locale]}/${slug}`;
}

/**
 * Public listing: samples are staging artifacts and must never be shown
 * publicly. A hub only exists once it has real (non-sample) content.
 */
export async function publishedVerdicts(locale: HomeLocale): Promise<Verdict[]> {
  return (await listVerdicts(locale)).filter((v) => !v.sample);
}

/* ------------------------------------------------------------------ */
/* Predictions                                                         */
/* ------------------------------------------------------------------ */

function weeklyDir(sport: Sport, period: string): string {
  return path.join(CONTENT_ROOT, 'predictions', sport, 'weekly', period);
}

async function parseWeekly(
  sport: Sport,
  period: string,
  locale: HomeLocale
): Promise<WeeklyPrediction | null> {
  const raw = await readFileSafe(path.join(weeklyDir(sport, period), `${LOCALE_DIR[locale]}.md`));
  if (raw == null) return null;
  const { data, body } = parseFrontmatter(raw);
  return {
    sport,
    period,
    locale,
    title: data.title ?? `${sport.toUpperCase()} ${period}`,
    summary: data.summary ?? '',
    models: splitList(data.models),
    rounds: toInt(data.rounds, 3),
    updated: data.updated ?? data.date ?? '',
    sample: toBool(data.sample),
    body,
  };
}

export async function getWeekly(
  sport: Sport,
  period: string,
  locale: HomeLocale
): Promise<WeeklyPrediction | null> {
  if (!/^[a-z0-9-]+$/.test(period)) return null;
  return parseWeekly(sport, period, locale);
}

export async function listWeekly(sport: Sport, locale: HomeLocale): Promise<WeeklyPrediction[]> {
  const periods = await listSubdirsSafe(path.join(CONTENT_ROOT, 'predictions', sport, 'weekly'));
  const weekly = await Promise.all(periods.map((p) => parseWeekly(sport, p, locale)));
  return weekly
    .filter((w): w is WeeklyPrediction => w !== null)
    .sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : 0));
}

export async function allWeekly(sport: Sport): Promise<WeeklyPrediction[]> {
  const out: WeeklyPrediction[] = [];
  for (const locale of ['en', 'zh', 'ja'] as HomeLocale[]) {
    out.push(...(await listWeekly(sport, locale)));
  }
  return out;
}

export async function weeklyLocales(sport: Sport, period: string): Promise<HomeLocale[]> {
  const locales: HomeLocale[] = ['en', 'zh', 'ja'];
  const results = await Promise.all(
    locales.map(async (locale) => ((await parseWeekly(sport, period, locale)) ? locale : null))
  );
  return results.filter((l): l is HomeLocale => l !== null);
}

async function parseDaily(sport: Sport, locale: HomeLocale): Promise<DailySlate | null> {
  const raw = await readFileSafe(
    path.join(CONTENT_ROOT, 'predictions', sport, 'daily', `${LOCALE_DIR[locale]}.md`)
  );
  if (raw == null) return null;
  const { data, body } = parseFrontmatter(raw);
  return {
    sport,
    locale,
    date: data.date ?? '',
    updated: data.updated ?? data.date ?? '',
    sample: toBool(data.sample),
    body,
  };
}

export async function getDaily(sport: Sport, locale: HomeLocale): Promise<DailySlate | null> {
  return parseDaily(sport, locale);
}

/** Sports that actually have published (non-sample) prediction content. */
export async function publishedSports(locale: HomeLocale): Promise<Sport[]> {
  if (predictionsDisabled()) return [];
  const out: Sport[] = [];
  for (const sport of SPORTS) {
    const slate = await getDaily(sport, locale);
    const weekly = await listWeekly(sport, locale);
    if ((slate && !slate.sample) || weekly.some((w) => !w.sample)) out.push(sport);
  }
  return out;
}

export async function sportHasPublished(locale: HomeLocale, sport: Sport): Promise<boolean> {
  if (predictionsDisabled()) return false;
  const slate = await getDaily(sport, locale);
  const weekly = await listWeekly(sport, locale);
  return Boolean((slate && !slate.sample) || weekly.some((w) => !w.sample));
}

export function weeklyUrl(locale: HomeLocale, sport: Sport, period: string): string {
  return `${PREDICTIONS_BASE[locale]}/${sport}/${period}`;
}

export function sportUrl(locale: HomeLocale, sport: Sport): string {
  return `${PREDICTIONS_BASE[locale]}/${sport}`;
}

/** Emergency kill switch — read at build time for static pages. */
export function predictionsDisabled(): boolean {
  return process.env.PREDICTIONS_OFF === '1';
}

/** A page has real (non-sample) content and may be indexed. */
export function isIndexable(sample: boolean): boolean {
  return !sample;
}
