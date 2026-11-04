#!/usr/bin/env node
/**
 * Generates AI Council verdict content for the SEO case pages.
 *
 * All content is company-authored: we choose the topics and run the debates
 * ourselves. No user session data is ever used.
 *
 * Default provider is OpenRouter called directly (cheap flash models, 2
 * debate rounds + 1 synthesis call) — it does not consume platform credits
 * and does not touch the production API.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... node scripts/generate-verdicts.mjs --dry-run
 *   OPENROUTER_API_KEY=sk-or-... node scripts/generate-verdicts.mjs
 *   OPENROUTER_API_KEY=sk-or-... node scripts/generate-verdicts.mjs --only=is-the-ai-boom-a-bubble --langs=en
 *
 * Flags:
 *   --dry-run        Validate input, print what would run, spend nothing.
 *   --only=<slug>    One topic only.
 *   --langs=en,zh-CN,ja
 *   --force          Regenerate even if the file exists.
 *
 * Env:
 *   OPENROUTER_API_KEY   Required.
 *   OPENROUTER_MODELS    Comma list; default minimax,deepseek,gemini-flash.
 *   ROUNDS               Debate rounds; default 2.
 *
 * Output: content/verdicts/{en,zh-CN,ja}/{slug}.md with sample: false.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY || '';

const ALL_LOCALES = ['en', 'zh-CN', 'ja'];

const LANGUAGE_NAME = {
  en: 'English',
  'zh-CN': 'Simplified Chinese',
  ja: 'Japanese',
};

const DEFAULT_MODELS = [
  'openai/gpt-6-luna',
  'deepseek/deepseek-v4.1-flash',
  'google/gemini-3.8-flash',
];

const MODELS = (process.env.OPENROUTER_MODELS || DEFAULT_MODELS.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ROUNDS = Number(process.env.ROUNDS || 2);

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

const DRY_RUN = Boolean(args['dry-run']);
const FORCE = Boolean(args.force);
const ONLY = args.only ? String(args.only) : null;
const LOCALES = args.langs ? String(args.langs).split(',').map((s) => s.trim()) : ALL_LOCALES;

const ESTIMATED_COST_PER_DEBATE_USD = 0.01;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function readFileSafe(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function oneLine(text, max = 240) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Meta description from the report: leading paragraph cut at a sentence boundary. */
function summaryFrom(report, max = 200) {
  const para = String(report || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('|') && !l.startsWith('>'));

  if (!para) return oneLine(report, 180);

  const sentences = para.match(/[^.!?。！？]+[.!?。！？]+/g) || [para];
  let out = '';
  for (const sentence of sentences) {
    out += sentence;
    if (out.trim().length >= 120) break;
    if (out.length > max + 60) break;
  }
  return (out || oneLine(para, 180)).trim();
}

/** Localize the four report section headings for non-English pages. */
const HEADING_MAP = {
  en: null,
  'zh-CN': [
    [/council verdict|委员会裁决|议会裁决/i, '议会裁决'],
    [/where the council agreed|共识|合意/i, '共识点'],
    [/where it disagreed|分歧/i, '分歧点'],
    [/risks? and caveats|风险/i, '风险与保留'],
  ],
  ja: [
    [/council verdict|カウンシルの判定/i, 'カウンシルの判定'],
    [/where the council agreed|合意した点/i, '合意した点'],
    [/where it disagreed|意見が分かれた点/i, '意見が分かれた点'],
    [/risks? and caveats|リスク/i, 'リスクと留保'],
  ],
};

function localizeHeadings(report, locale) {
  const map = HEADING_MAP[locale];
  if (!map) return report;
  return report
    .split('\n')
    .map((line) => {
      const match = /^##\s+(.*)$/.exec(line);
      if (!match) return line;
      const title = match[1].trim();
      const hit = map.find(([pattern]) => pattern.test(title));
      return hit ? `## ${hit[1]}` : line;
    })
    .join('\n');
}

function shortModelName(id) {
  const map = {
    'openai/gpt-6-luna': 'GPT-6 Luna',
    'openai/gpt-6-luna-pro': 'GPT-6 Luna Pro',
    'minimax/minimax-m3.1-flash': 'MiniMax M3.1 Flash',
    'deepseek/deepseek-v4.1-flash': 'DeepSeek V4.1 Flash',
    'google/gemini-3.8-flash': 'Gemini 3.8 Flash',
  };
  return map[id] || id.split('/').pop();
}

/* ------------------------------------------------------------------ */
/* OpenRouter                                                          */
/* ------------------------------------------------------------------ */

async function chat({ model, messages, maxTokens }) {
  let tokens = maxTokens;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'LLM Conclave SEO',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: tokens,
          temperature: 0.7,
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${oneLine(await res.text(), 200)}`);
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;

      // Reasoning models can burn the whole budget on reasoning and return
      // empty content. Retry once with a larger budget before giving up.
      if (!content || !String(content).trim()) {
        if (choice?.finish_reason === 'length' && tokens < 4000) {
          tokens *= 2;
          console.log(`    ${shortModelName(model)}: spent budget on reasoning, retry at ${tokens} tokens`);
          continue;
        }
        throw new Error('empty content');
      }
      return String(content).trim();
    } catch (err) {
      if (attempt === 4) throw err;
      const wait = 2000 * attempt;
      console.log(`    retry ${attempt}/3 after ${wait}ms (${err instanceof Error ? err.message : err})`);
      await sleep(wait);
    }
  }
  throw new Error('unreachable');
}

const SYSTEM = (locale) =>
  `You are one member of a council of AI models. Answer in ${LANGUAGE_NAME[locale]}. ` +
  `Be concise, specific and honest. No preamble, no markdown headings.`;

const ROUND1_PROMPT = (locale, query) =>
  `Question: ${query}\n\n` +
  `Give your position in at most 140 words: your answer/recommendation, the 2-3 decisive reasons, and your confidence (1-10). ` +
  `Write in ${LANGUAGE_NAME[locale]}.`;

const ROUND2_PROMPT = (locale, query, answers) =>
  `Question: ${query}\n\n` +
  `Other council members answered:\n\n${answers}\n\n` +
  `Reconsider: revise your position if their arguments are stronger, otherwise defend it. ` +
  `At most 120 words. State clearly where you agree and where you disagree. ` +
  `Write in ${LANGUAGE_NAME[locale]}.`;

const SYNTH_PROMPT = (locale, query, transcript) =>
  `You are the chair of an AI council. Question: ${query}\n\n` +
  `Council inputs:\n\n${transcript}\n\n` +
  `Write a structured consensus report in ${LANGUAGE_NAME[locale]} using exactly these markdown sections:\n` +
  `## Council verdict\n(A 3-5 sentence recommendation with an overall confidence level.)\n` +
  `## Where the council agreed\n(3-5 bullet points.)\n` +
  `## Where it disagreed\n(1-3 bullet points, or "No material disagreement" if unanimous.)\n` +
  `## Risks and caveats\n(2-3 bullet points.)\n\n` +
  `Rules: be specific and balanced; mention model differences only when substantive; no preamble; total under 380 words.`;

async function debate({ query, locale }) {
  // Round 1 — independent answers
  const round1 = await Promise.all(
    MODELS.map(async (model) => ({
      model,
      text: await chat({
        model,
        messages: [
          { role: 'system', content: SYSTEM(locale) },
          { role: 'user', content: ROUND1_PROMPT(locale, query) },
        ],
        maxTokens: 1400,
      }),
    }))
  );
  console.log(`    round 1 done (${round1.length} models)`);

  const answers = round1
    .map(({ model, text }) => `- ${shortModelName(model)}: ${oneLine(text, 600)}`)
    .join('\n');

  // Round 2 — cross-examination
  const round2 = await Promise.all(
    MODELS.map(async (model) => ({
      model,
      text: await chat({
        model,
        messages: [
          { role: 'system', content: SYSTEM(locale) },
          { role: 'user', content: ROUND2_PROMPT(locale, query, answers) },
        ],
        maxTokens: 2400,
      }),
    }))
  );
  console.log(`    round 2 done`);

  const transcript = [...round1, ...round2]
    .map(({ model, text }) => `### ${shortModelName(model)}\n${text}`)
    .join('\n\n');

  // Synthesis — structured report
  const report = await chat({
    model: MODELS[MODELS.length - 1],
    messages: [
      { role: 'system', content: `You are a neutral chair writing in ${LANGUAGE_NAME[locale]}. Return the report only.` },
      { role: 'user', content: SYNTH_PROMPT(locale, query, oneLine(transcript, 6000)) },
    ],
    maxTokens: 2400,
  });

  return {
    report,
    participants: MODELS.map(shortModelName),
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const badLocale = LOCALES.find((l) => !ALL_LOCALES.includes(l));
  if (badLocale) throw new Error(`Unknown locale: ${badLocale}`);

  if (!DRY_RUN && !API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required (or pass --dry-run)');
  }

  const topics = JSON.parse(await readFileSafe(path.join(CONTENT, 'verdicts', 'topics.json')));
  const ready = topics.filter((t) => t.status === 'ready' && (!ONLY || t.slug === ONLY));

  if (ready.length === 0) {
    console.log(`No ready topics${ONLY ? ` matching --only=${ONLY}` : ''}.`);
    return;
  }

  console.log(
    `verdicts: ${ready.length} topic(s) × ${LOCALES.length} locale(s), ` +
      `${MODELS.length} models × ${ROUNDS} rounds + synthesis${DRY_RUN ? ' [dry-run]' : ''}`
  );

  let debates = 0;

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
        console.log(`would generate: ${topic.slug} [${locale}] — ${oneLine(query, 90)}`);
        debates += 1;
        continue;
      }

      console.log(`generating: ${topic.slug} [${locale}]`);
      const { report: rawReport, participants } = await debate({ query, locale });
      const report = localizeHeadings(rawReport, locale);

      const summaryLine =
        report
          .split(/\r?\n/)
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('|')) ||
        oneLine(report, 180);

      const frontmatter = [
        '---',
        `title: ${oneLine(query, 120)}`,
        `summary: ${summaryFrom(report)}`,
        `lang: ${locale}`,
        `models: ${participants.join(', ')}`,
        `rounds: ${ROUNDS}`,
        `date: ${new Date().toISOString().slice(0, 10)}`,
        'sample: false',
        '---',
        '',
      ].join('\n');

      await writeFile(target, `${frontmatter}${report}\n`);
      debates += 1;
      console.log(`  wrote → ${path.relative(ROOT, target)}`);
    }
  }

  console.log(
    DRY_RUN
      ? `\nDry run: ${debates} debate(s), estimated ~$${(debates * ESTIMATED_COST_PER_DEBATE_USD).toFixed(2)}.`
      : `\nDone: ${debates} debate(s).`
  );
}

main().catch((err) => {
  console.error(`\nFAILED: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
