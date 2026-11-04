#!/usr/bin/env node
/**
 * Generates real multi-model debate content for the SEO content pages.
 *
 * Everything written here is produced by company-run debates against the
 * public Agent API — never from user sessions.
 *
 * Usage:
 *   AGENT_API_KEY=llmc_xxx node scripts/generate-verdicts.mjs --kind=verdicts
 *   AGENT_API_KEY=llmc_xxx node scripts/generate-verdicts.mjs --kind=weekly --sport=nba --period=2026-w46
 *   AGENT_API_KEY=llmc_xxx node scripts/generate-verdicts.mjs --kind=daily --sport=nba --date=2026-11-06
 *
 * Common flags:
 *   --dry-run            Validate inputs only, no API calls.
 *   --estimate           Print estimated credit cost (needs --dry-run or runs anyway).
 *   --only=<slug>        (verdicts only) Generate a single topic.
 *   --langs=en,zh-CN,ja  Restrict languages (default: all three).
 *   --models=gemini,openai,deepseek,claude
 *   --rounds=3
 *   --force              Regenerate even if the target file already exists.
 *
 * Environment:
 *   AGENT_API_KEY        Required unless --dry-run. Never commit this.
 *   API_BASE             Default https://llmconclave.com
 *
 * Debates are strictly serial — the API rejects concurrent runs per user (409).
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');

const API_BASE = (process.env.API_BASE || 'https://llmconclave.com').replace(/\/$/, '');
const API_KEY = process.env.AGENT_API_KEY || '';

const ALL_LOCALES = ['en', 'zh-CN', 'ja'];

const SPORT_LABEL = {
  nba: { en: 'NBA', 'zh-CN': 'NBA', ja: 'NBA' },
  football: { en: 'Football', 'zh-CN': '足球', ja: 'サッカー' },
  esports: { en: 'Esports', 'zh-CN': '电竞', ja: 'eスポーツ' },
  keirin: { en: 'Keirin', 'zh-CN': '竞轮', ja: '競輪' },
};

const REPORT_TITLE = {
  en: (sport, period) => `${sport} ${period} — AI Council Predictions`,
  'zh-CN': (sport, period) => `${sport} ${period} —— AI 议会预测`,
  ja: (sport, period) => `${sport} ${period} —— AIカウンシル予測`,
};

const ESTIMATED_CREDITS_PER_DEBATE = 300;

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const rawArgs = process.argv.slice(2);
const args = {};
for (const raw of rawArgs) {
  if (!raw.startsWith('--')) continue;
  const [key, value] = raw.replace(/^--/, '').split('=');
  args[key] = value === undefined ? true : value;
}

const KIND = String(args.kind || 'verdicts');
const DRY_RUN = Boolean(args['dry-run']);
const FORCE = Boolean(args.force);
const ONLY = args.only ? String(args.only) : null;
const SPORT = args.sport ? String(args.sport) : null;
const PERIOD = args.period ? String(args.period) : null;
const DATE = args.date ? String(args.date) : new Date().toISOString().slice(0, 10);
const LOCALES = args.langs ? String(args.langs).split(',').map((s) => s.trim()) : ALL_LOCALES;
const MODELS = args.models
  ? String(args.models).split(',').map((s) => s.trim())
  : ['gemini', 'openai', 'deepseek', 'claude'];
const ROUNDS = args.rounds ? Number(args.rounds) : 3;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function oneLine(text, max = 220) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function summaryFromReport(markdown) {
  // First substantive paragraph of the report, for meta description / card.
  const lines = String(markdown || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('|')) {
      continue;
    }
    if (trimmed.length >= 40) return oneLine(trimmed.replace(/^[-*>\s]+/, ''), 200);
  }
  return oneLine(markdown, 200);
}

function idemKey(parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 20);
}

function parseSseChunk(chunk) {
  let event = 'message';
  const dataLines = [];
  for (const line of chunk.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  return { event, data: dataLines.join('\n') };
}

/** Runs one debate and returns the `final` event payload. */
async function runDebate({ query, locale, key }) {
  const res = await fetch(`${API_BASE}/api/agent/debate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ query, models: MODELS, maxRounds: ROUNDS, locale }),
  });

  if (res.status === 409) {
    throw new Error('DEBATE_ALREADY_RUNNING');
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${oneLine(await res.text(), 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const evt = parseSseChunk(chunk);
      if (evt.event === 'final') return JSON.parse(evt.data);
      if (evt.event === 'error') throw new Error(`debate error: ${oneLine(evt.data, 300)}`);
    }
  }
  throw new Error('stream ended without a final event');
}

/** Serial execution with 409 backoff. */
async function runDebateWithRetry(params, label) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await runDebate(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message !== 'DEBATE_ALREADY_RUNNING' || attempt === 4) throw err;
      console.log(`  [${label}] another debate is running — waiting 90s (attempt ${attempt}/3)`);
      await sleep(90_000);
    }
  }
  throw new Error('unreachable');
}

/* ------------------------------------------------------------------ */
/* Verdicts                                                            */
/* ------------------------------------------------------------------ */

async function generateVerdicts() {
  const topicsFile = path.join(CONTENT, 'verdicts', 'topics.json');
  const topics = await readJson(topicsFile);
  const ready = topics.filter((t) => t.status === 'ready' && (!ONLY || t.slug === ONLY));

  if (ready.length === 0) {
    console.log('No ready topics' + (ONLY ? ` matching --only=${ONLY}` : '') + '.');
    return { debates: 0, credits: 0 };
  }

  let debates = 0;
  let credits = 0;

  for (const topic of ready) {
    for (const locale of LOCALES) {
      const query = topic.queries?.[locale];
      if (!query) {
        console.log(`skip ${topic.slug} [${locale}]: no query`);
        continue;
      }

      const target = path.join(CONTENT, 'verdicts', locale, `${topic.slug}.md`);
      if (!FORCE && (await exists(target))) {
        console.log(`skip ${topic.slug} [${locale}]: exists`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`would debate: ${topic.slug} [${locale}] — ${oneLine(query, 80)}`);
        debates += 1;
        credits += ESTIMATED_CREDITS_PER_DEBATE;
        continue;
      }

      console.log(`debating: ${topic.slug} [${locale}]`);
      const final = await runDebateWithRetry(
        {
          query,
          locale,
          key: idemKey(['verdict', topic.slug, locale]),
        },
        topic.slug
      );

      const body = String(final.summary || '').trim();
      if (!body) throw new Error(`empty report for ${topic.slug} [${locale}]`);

      const frontmatter = [
        '---',
        `title: ${oneLine(query, 120)}`,
        `summary: ${summaryFromReport(body)}`,
        `lang: ${locale}`,
        `models: ${(final.participants || []).join(', ')}`,
        `rounds: ${ROUNDS}`,
        `date: ${DATE}`,
        'sample: false',
        '---',
        '',
      ].join('\n');

      await writeFile(target, `${frontmatter}${body}\n`);
      debates += 1;
      credits += Number(final.creditsUsed) || 0;
      console.log(`  done (${final.creditsUsed} credits) → ${path.relative(ROOT, target)}`);
    }
  }

  return { debates, credits };
}

/* ------------------------------------------------------------------ */
/* Predictions                                                         */
/* ------------------------------------------------------------------ */

function sportName(sport, locale) {
  return SPORT_LABEL[sport]?.[locale] || sport.toUpperCase();
}

async function generatePredictions(kind) {
  if (!SPORT || !SPORT_LABEL[SPORT]) {
    throw new Error(`--sport must be one of: ${Object.keys(SPORT_LABEL).join(', ')}`);
  }
  if (kind === 'weekly' && !PERIOD) {
    throw new Error('--period is required for weekly (e.g. --period=2026-w46)');
  }

  const schedule = await readJson(path.join(CONTENT, 'predictions', 'schedule.json'));
  const sportSchedule = schedule[SPORT] || {};
  const key = kind === 'weekly' ? PERIOD : DATE;
  const matches = sportSchedule[kind]?.[key] || [];

  if (matches.length === 0) {
    console.log(`No ${kind} matches scheduled for ${SPORT} ${key}. Add them to content/predictions/schedule.json.`);
    return { debates: 0, credits: 0 };
  }

  let debates = 0;
  let credits = 0;

  for (const locale of LOCALES) {
    const target =
      kind === 'weekly'
        ? path.join(CONTENT, 'predictions', SPORT, 'weekly', PERIOD, `${locale}.md`)
        : path.join(CONTENT, 'predictions', SPORT, 'daily', `${locale}.md`);

    if (!FORCE && (await exists(target))) {
      console.log(`skip ${SPORT} ${kind} [${locale}]: exists`);
      continue;
    }

    const sections = [];
    let participants = [];

    for (const match of matches) {
      const query = match.queries?.[locale];
      if (!query) continue;

      if (DRY_RUN) {
        console.log(`would debate: ${match.matchup} [${locale}]`);
        debates += 1;
        credits += ESTIMATED_CREDITS_PER_DEBATE;
        continue;
      }

      console.log(`debating: ${match.matchup} [${locale}]`);
      const final = await runDebateWithRetry(
        {
          query,
          locale,
          key: idemKey([SPORT, kind, key, match.id || match.matchup, locale]),
        },
        match.matchup
      );
      sections.push(`## ${match.matchup}\n\n${String(final.summary || '').trim()}\n`);
      participants = [...new Set([...participants, ...(final.participants || [])])];
      debates += 1;
      credits += Number(final.creditsUsed) || 0;
      console.log(`  done (${final.creditsUsed} credits)`);
    }

    if (DRY_RUN) continue;
    if (sections.length === 0) continue;

    const frontmatter =
      kind === 'weekly'
        ? [
            '---',
            `title: ${REPORT_TITLE[locale](sportName(SPORT, locale), PERIOD)}`,
            `summary: AI council predictions for ${matches.length} matchup(s) in ${PERIOD}.`,
            `lang: ${locale}`,
            `models: ${participants.join(', ')}`,
            `rounds: ${ROUNDS}`,
            `updated: ${DATE}`,
            'sample: false',
            '---',
            '',
          ].join('\n')
        : [
            '---',
            `sport: ${SPORT}`,
            `date: ${DATE}`,
            `updated: ${DATE}`,
            `lang: ${locale}`,
            'sample: false',
            '---',
            '',
          ].join('\n');

    await writeFile(target, `${frontmatter}${sections.join('\n')}\n`);
    console.log(`  wrote → ${path.relative(ROOT, target)}`);
  }

  return { debates, credits };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  if (!ALL_LOCALES.includes('en')) {
    throw new Error('locale set corrupted');
  }
  const badLocale = LOCALES.find((l) => !ALL_LOCALES.includes(l));
  if (badLocale) throw new Error(`Unknown locale: ${badLocale}`);

  if (!DRY_RUN && !API_KEY) {
    throw new Error('AGENT_API_KEY is required (set it in your local shell; never commit it)');
  }

  console.log(
    `${KIND} generation — models=[${MODELS.join(', ')}] rounds=${ROUNDS} locales=[${LOCALES.join(', ')}]` +
      `${DRY_RUN ? ' [dry-run]' : ''}`
  );

  let result;
  if (KIND === 'verdicts') {
    result = await generateVerdicts();
  } else if (KIND === 'weekly' || KIND === 'daily') {
    result = await generatePredictions(KIND);
  } else {
    throw new Error('--kind must be one of: verdicts, weekly, daily');
  }

  const count = result?.debates ?? 0;
  const credits = result?.credits ?? 0;
  if (DRY_RUN) {
    console.log(`\nDry run: ${count} debate(s), estimated ~${credits} credits.`);
  } else {
    console.log(`\nDone: ${count} debate(s), ${credits} credits used.`);
  }
}

main().catch((err) => {
  console.error(`\nFAILED: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
