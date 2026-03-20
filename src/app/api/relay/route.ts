import fs from 'fs';
import path from 'path';
import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { logger } from '@/lib/logger';
import { jobStore } from '@/lib/relay/job-store-factory';
import { isSaas } from '@/lib/flags';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { checkAndDeductCredits, refundCredits } from '@/lib/credits/deduct';
import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import { MAX_ROUNDS_HARD_LIMIT } from '@/config/credit-packages';
import {
  getDebateSystemPrompt,
  getUserRoleLabel,
  getParticipantSeparator,
  getDateLocaleString,
  getReportTemplate,
  getResearchMethod,
  getTokensLabel,
  getCreditCostLabel,
  getSummaryPromptFull,
  getInitialPropositionLabel,
  getCurrentDiscussionLabel,
  getSelfLabel,
} from '@/i18n/prompts';
import type { Locale } from '@/i18n';
import type { ProviderId } from '@/types/config';
import type { RelayUsageStats } from '@/types/chat';

export const dynamic = 'force-dynamic';

interface RelayModelInput {
  id: string;
  modelId: string;
  providerId: string;
  displayName: string;
  apiKey?: string;
  isPreset?: boolean;
  baseUrl?: string;
}

interface RelayRequest {
  sessionId: string;
  query: string;
  maxRounds: number;
  models: RelayModelInput[];
  priorContext: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>;
  locale?: Locale;
  generateReport?: boolean;
}

export async function POST(req: Request): Promise<Response> {
  let body: RelayRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sessionId, query, maxRounds: rawMaxRounds, models, priorContext, locale = 'zh-CN', generateReport = true } = body;
  const maxRounds = Math.min(rawMaxRounds, MAX_ROUNDS_HARD_LIMIT);

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!models || models.length === 0) {
    return new Response(JSON.stringify({ error: 'No models provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // SaaS mode: require authenticated user with at least 1 credit
  let saasUserId: string | null = null;
  let preDeductedCost = 0; // tracks upfront deduction so the finally block can refund the unused portion
  if (isSaas) {
    // Internal bypass: /api/agent/debate handles auth + billing itself
    const agentUserId = req.headers.get('x-agent-user-id');
    const agentSecret = req.headers.get('x-agent-secret');
    const internalSecret = process.env.INTERNAL_RELAY_SECRET;
    if (agentUserId && internalSecret && agentSecret === internalSecret) {
      saasUserId = agentUserId;
      // Skip cookie auth + credit deduction — already handled by the caller
    } else {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    saasUserId = user.id;

    // Pre-check: user must have at least 1 credit
    const adminClient = createAdminClient();
    const { data: creditRow } = await adminClient
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    let currentBalance = creditRow ? (creditRow.balance as number) : null;

    if (currentBalance === null) {
      // No row yet — auto-seed welcome credits
      const { addWelcomeCredits } = await import('@/lib/credits/deduct');
      const { WELCOME_CREDITS } = await import('@/config/credit-packages');
      await addWelcomeCredits({ userId: user.id, supabase: adminClient, amount: WELCOME_CREDITS });
      // Re-query to confirm the write succeeded
      const { data: seeded } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      currentBalance = seeded ? (seeded.balance as number) : 0;
    }

    // Pre-check: user must be able to afford the full expected session cost (maxRounds × per-round cost)
    const minRoundCost = models
      .filter((m) => m.isPreset)
      .reduce((sum, m) => {
        const preset = PRESET_DEFINITIONS.find((p) => p.id === m.id);
        return sum + (preset?.creditsPerRound ?? 0);
      }, 0);
    const totalExpectedCost = maxRounds * minRoundCost;

    if (currentBalance < Math.max(1, totalExpectedCost)) {
      return new Response(JSON.stringify({ error: 'CREDITS_INSUFFICIENT', required: totalExpectedCost, balance: currentBalance }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pre-deduct the full expected cost upfront — unused portion is refunded in the finally block
    const preDeductResult = await checkAndDeductCredits({
      userId: user.id,
      cost: totalExpectedCost,
      relaySessionId: sessionId,
      supabase: adminClient,
    });
    if (!preDeductResult.ok) {
      return new Response(JSON.stringify({ error: 'CREDITS_INSUFFICIENT', required: totalExpectedCost, balance: currentBalance }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    preDeductedCost = totalExpectedCost;
    } // end else (normal auth path)
  }

  // Create a job for this relay session. The relay runs independently of the HTTP connection.
  await jobStore.createJob(sessionId);
  const startTime = Date.now();

  // writeRelaySSE writes to the job store (buffered + broadcast to all SSE subscribers).
  // This continues even if the original client has disconnected.
  const writeRelaySSE = async (data: object) => {
    await jobStore.appendJobEvent(sessionId, data);
  };

  // Run the relay in a detached background task — NOT awaited.
  // The relay uses job.abort.signal to detect explicit stops (Stop button).
  // Client disconnects (req.signal) do NOT abort the relay.
  (async () => {
    let totalCreditCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let charCount = priorContext.reduce((sum, m) => sum + m.content.length, 0) + query.length;
    // Per-call usage — reset before each model call, logged after
    let modelInputTokens = 0;
    let modelOutputTokens = 0;
    const onUsage = (usage: { inputTokens: number; outputTokens: number }) => {
      modelInputTokens += usage.inputTokens;
      modelOutputTokens += usage.outputTokens;
      totalInputTokens += usage.inputTokens;
      totalOutputTokens += usage.outputTokens;
    };

    // Per-model stats for the summary bubble
    const perModelStats: Record<string, {
      displayName: string; modelId: string;
      inputTokens: number; outputTokens: number;
      roundsCompleted: number; finishedEarly: boolean;
    }> = {};
    for (const m of models) {
      perModelStats[m.id] = { displayName: m.displayName, modelId: m.modelId, inputTokens: 0, outputTokens: 0, roundsCompleted: 0, finishedEarly: false };
    }

    try {
      const fullContext: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }> = [
        ...priorContext,
        { role: 'user', content: query },
      ];

      const finishedModelIds = new Set<string>();

      outerLoop: for (let round = 0; round < maxRounds; round++) {
        if (await jobStore.isJobAborted(sessionId)) break;

        const activeModels = models.filter((m) => !finishedModelIds.has(m.id));
        if (activeModels.length === 0) break;

        for (let i = 0; i < activeModels.length; i++) {
          if (await jobStore.isJobAborted(sessionId)) break outerLoop;

          const model = activeModels[i];
          const provider = PROVIDER_REGISTRY[model.providerId as ProviderId];
          if (!provider) {
            await writeRelaySSE({ type: 'error', message: `Unknown provider: ${model.providerId}` });
            return;
          }

          // Resolve API key
          let apiKey: string;
          if (model.isPreset) {
            const preset = PRESET_DEFINITIONS.find((p) => p.id === model.id);
            if (!preset?.apiKey) {
              await writeRelaySSE({ type: 'error', message: `Preset not found or missing key: ${model.id}` });
              return;
            }
            apiKey = preset.apiKey;
          } else {
            if (!model.apiKey) {
              await writeRelaySSE({ type: 'error', message: `No API key for ${model.displayName}` });
              return;
            }
            apiKey = model.apiKey;
          }

          const baseUrl = model.baseUrl || provider.defaultBaseUrl;

          await writeRelaySSE({ type: 'model_start', modelIndex: i, displayName: model.displayName, round });

          // Reset per-call counters before each model
          modelInputTokens = 0;
          modelOutputTokens = 0;

          const systemPrompt = buildDebateSystemPrompt(locale, query, model.displayName);
          const isFirstCall = round === 0 && i === 0;
          const messagesForModel: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }> =
            isFirstCall
              ? [...fullContext]
              : [{ role: 'user', content: formatDebateContext(locale, query, fullContext, model.displayName) }];

          let fullContent = '';
          const writeSSE = async (data: { type: string; content?: string; message?: string }) => {
            if (data.type === 'chunk' && data.content) {
              fullContent += data.content;
              await writeRelaySSE({ type: 'content', text: data.content });
            }
          };

          // Keepalive: keeps the SSE connection alive on iOS Safari (~30s idle timeout)
          const modelKeepaliveTimer = setInterval(async () => {
            try { await writeRelaySSE({ type: 'keepalive' }); } catch { /* job may be done */ }
          }, 12000);

          try {
            switch (provider.protocol) {
              case 'openai-compatible':
                await streamFromOpenAI({ apiKey, baseUrl, model: model.modelId, system: systemPrompt, messages: messagesForModel, writeSSE, onUsage });
                break;
              case 'anthropic':
                await streamFromAnthropic({ apiKey, baseUrl, model: model.modelId, system: systemPrompt, messages: messagesForModel, writeSSE, onUsage });
                break;
              case 'google-gemini':
                await streamFromGemini({ apiKey, baseUrl, model: model.modelId, system: systemPrompt, messages: messagesForModel, writeSSE, onUsage });
                break;
              default:
                await writeRelaySSE({ type: 'error', message: `Unknown protocol: ${provider.protocol}` });
                return;
            }
          } catch (err) {
            clearInterval(modelKeepaliveTimer);
            if (await jobStore.isJobAborted(sessionId)) return;
            logger.error(`[API/relay] Model error (${model.displayName}):`, err);
            await writeRelaySSE({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
            return;
          } finally {
            clearInterval(modelKeepaliveTimer);
          }

          // Detect and strip [FINISH]
          const finished = /\[FINISH\]/i.test(fullContent);
          const content = fullContent.replace(/\s*\[FINISH\]\s*/gi, '').trim();

          if (finished) finishedModelIds.add(model.id);

          // Include round and modelIndex so client can build deterministic message IDs
          await writeRelaySSE({
            type: 'model_done',
            round,
            modelIndex: i,
            modelId: model.modelId,
            providerId: model.providerId,
            displayName: model.displayName,
            content,
            finished,
          });

          logger.info(
            `[TOKEN] session=${sessionId} round=${round + 1}/${maxRounds} model=${model.displayName}(${model.modelId})` +
            ` in=${modelInputTokens} out=${modelOutputTokens} total=${modelInputTokens + modelOutputTokens}`
          );

          if (perModelStats[model.id]) {
            perModelStats[model.id].inputTokens += modelInputTokens;
            perModelStats[model.id].outputTokens += modelOutputTokens;
            perModelStats[model.id].roundsCompleted += 1;
            if (finished) perModelStats[model.id].finishedEarly = true;
          }

          // Accumulate per-model credit cost
          if (model.isPreset) {
            const preset = PRESET_DEFINITIONS.find((p) => p.id === model.id);
            if (preset) totalCreditCost += preset.creditsPerRound;
          }

          if (content.length > 0) {
            fullContext.push({ role: 'assistant', content, displayName: model.displayName });
            charCount += content.length;
          }
        }

        if (finishedModelIds.size === models.length) break;
      }

      // Generate meeting minutes — only skip if explicitly stopped or report disabled
      if (!(await jobStore.isJobAborted(sessionId)) && generateReport !== false) {
        const refund = isSaas ? Math.max(0, preDeductedCost - totalCreditCost) : 0;
        const usageStats: RelayUsageStats = {
          models: Object.values(perModelStats),
          totalInputTokens,
          totalOutputTokens,
          creditCost: totalCreditCost,
          refund,
          maxRounds,
        };
        await generateSummary(models, fullContext, query, startTime, locale, writeRelaySSE, totalCreditCost, usageStats);
      }

      logger.info(
        `[TOKEN] session=${sessionId} TOTAL in=${totalInputTokens} out=${totalOutputTokens}` +
        ` sum=${totalInputTokens + totalOutputTokens} credits=${totalCreditCost}`
      );
      await writeRelaySSE({ type: 'relay_done', totalInputTokens, totalOutputTokens });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[API/relay] Unexpected error:', err);
      try {
        await writeRelaySSE({ type: 'error', message });
      } catch { /* job emitter may be gone */ }
    } finally {
      // Refund the unused portion of the pre-deducted cost (early exit, user stop, fewer rounds)
      if (isSaas && saasUserId && preDeductedCost > totalCreditCost) {
        try {
          const adminClient = createAdminClient();
          await refundCredits({
            userId: saasUserId,
            amount: preDeductedCost - totalCreditCost,
            relaySessionId: sessionId,
            supabase: adminClient,
          });
        } catch (err) {
          logger.error('[API/relay] Credit refund failed:', err);
        }
      }

      try {
        await writeRelaySSE({ type: 'done' });
      } catch {}
      const wasAborted = await jobStore.isJobAborted(sessionId);
      await jobStore.finishJob(sessionId, wasAborted ? 'error' : 'done');
    }
  })();

  // Return SSE stream that reads from the job store.
  // If this client disconnects, the relay continues and a reconnecting client can
  // use GET /api/relay/events?sessionId=xxx to resume.
  return jobStore.createJobSSEStream(sessionId, 0);
}

async function generateSummary(
  models: RelayModelInput[],
  fullContext: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>,
  originalQuery: string,
  startTime: number,
  locale: Locale,
  writeRelaySSE: (data: object) => Promise<void>,
  creditCost: number,
  usageStats?: RelayUsageStats
): Promise<void> {
  // Always prefer Gemini Flash for summary generation (cost-efficient, platform-borne expense).
  // Falls back to first usable model if Gemini is unavailable.
  let summaryApiKey: string | null = null;
  let summaryModel: RelayModelInput | null = null;

  const geminiPreset = PRESET_DEFINITIONS.find((p) => p.id === 'Gemini');
  if (geminiPreset?.apiKey) {
    summaryApiKey = geminiPreset.apiKey;
    summaryModel = {
      id: geminiPreset.id,
      modelId: geminiPreset.modelId,
      providerId: geminiPreset.providerId,
      displayName: geminiPreset.displayName,
      baseUrl: geminiPreset.baseUrl,
      isPreset: true,
    };
  } else {
    for (const model of models) {
      if (model.isPreset) {
        const preset = PRESET_DEFINITIONS.find((p) => p.id === model.id);
        if (preset?.apiKey) {
          summaryApiKey = preset.apiKey;
          summaryModel = model;
          break;
        }
      } else if (model.apiKey) {
        summaryApiKey = model.apiKey;
        summaryModel = model;
        break;
      }
    }
  }

  if (!summaryApiKey || !summaryModel) {
    logger.warn('[API/relay] No model available for summary generation');
    return;
  }

  // Get template: locale-specific inline for EN/JA, or read zh-CN file from disk
  let templateContent: string;
  const inlineTemplate = getReportTemplate(locale);
  if (inlineTemplate) {
    templateContent = inlineTemplate;
  } else {
    const templatePath = path.join(process.cwd(), 'src', 'AI智囊团专题研讨交付MD.md');
    try {
      templateContent = fs.readFileSync(templatePath, 'utf-8');
    } catch {
      logger.warn('[API/relay] Report template file not found, skipping summary');
      return;
    }
  }

  const userLabel = getUserRoleLabel(locale);
  const separator = getParticipantSeparator(locale);
  const dateLocale = getDateLocaleString(locale);

  const conversation = fullContext
    .map((m) => {
      const label = m.role === 'user' ? userLabel : (m.displayName || 'AI');
      return `${label}:\n${m.content}`;
    })
    .join('\n\n');

  const participatingModels = [
    ...new Set(
      fullContext
        .filter((m) => m.role === 'assistant')
        .map((m) => m.displayName || 'AI')
    ),
  ].join(separator);

  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  const totalChars = fullContext.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedTokens = Math.round(totalChars / 2);

  const dateStr = new Date().toLocaleString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Pre-inject metadata so the AI doesn't need to format/replace them
  const researchMethod = getResearchMethod(locale, participatingModels, elapsedSec);
  const topicShort = originalQuery.slice(0, 30) + (originalQuery.length > 30 ? '...' : '');
  const filledTemplate = templateContent
    .replace('{{会议简要主题}}', topicShort)
    .replace('{{会议主题}}', originalQuery)
    .replace('{{获取当前时间}}', dateStr)
    .replace('{{估算全场对话的总Token消耗}}', getTokensLabel(locale, estimatedTokens))
    .replace('{{本次credit消耗}}', getCreditCostLabel(locale, creditCost))
    .replace(/\{\{请根据全场对话记录进行提炼。[\s\S]*?\}\}/, researchMethod);

  const summaryPrompt = getSummaryPromptFull(locale, filledTemplate, conversation);

  const provider = PROVIDER_REGISTRY[summaryModel.providerId as ProviderId];
  if (!provider) return;

  const baseUrl = summaryModel.baseUrl || provider.defaultBaseUrl;

  // Send summary_start so the client switches to summary accumulation mode
  await writeRelaySSE({ type: 'summary_start' });

  const writeSSE = async (data: { type: string; content?: string; message?: string }) => {
    if (data.type === 'chunk' && data.content) {
      await writeRelaySSE({ type: 'content', text: data.content });
    }
  };

  // Keepalive during summary generation
  const keepaliveTimer = setInterval(async () => {
    try {
      await writeRelaySSE({ type: 'keepalive' });
    } catch { /* job may be done */ }
  }, 12000);

  try {
    switch (provider.protocol) {
      case 'openai-compatible':
        await streamFromOpenAI({ apiKey: summaryApiKey, baseUrl, model: summaryModel.modelId, messages: [{ role: 'user', content: summaryPrompt }], writeSSE });
        break;
      case 'anthropic':
        await streamFromAnthropic({ apiKey: summaryApiKey, baseUrl, model: summaryModel.modelId, messages: [{ role: 'user', content: summaryPrompt }], writeSSE });
        break;
      case 'google-gemini':
        await streamFromGemini({ apiKey: summaryApiKey, baseUrl, model: summaryModel.modelId, messages: [{ role: 'user', content: summaryPrompt }], writeSSE });
        break;
    }
  } catch (err) {
    clearInterval(keepaliveTimer);
    logger.error('[API/relay] Summary generation failed:', err);
    return;
  }

  clearInterval(keepaliveTimer);

  const dateStrForFile = new Date().toISOString().slice(0, 10);
  const filename = `ai-council-${dateStrForFile}.pdf`;
  const topic = originalQuery.slice(0, 20) + (originalQuery.length > 20 ? '…' : '');

  // markdown is omitted — client accumulates it from content events
  await writeRelaySSE({
    type: 'summary_done',
    elapsedSec,
    filename,
    topic,
    usageStats,
  });
}

function buildDebateSystemPrompt(locale: Locale, originalQuery: string, modelDisplayName: string): string {
  return getDebateSystemPrompt(locale, originalQuery, modelDisplayName);
}

function formatDebateContext(
  locale: Locale,
  originalQuery: string,
  context: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>,
  currentModelDisplayName: string
): string {
  const propLabel = getInitialPropositionLabel(locale);
  const discussLabel = getCurrentDiscussionLabel(locale);
  return `【${propLabel}】：${originalQuery}

【${discussLabel}】：
${formatRelayContext(locale, context, currentModelDisplayName)}`;
}

function formatRelayContext(
  locale: Locale,
  context: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>,
  currentModelDisplayName?: string
): string {
  const userLabel = getUserRoleLabel(locale);
  return context
    .map((m) => {
      let label: string;
      if (m.role === 'user') {
        label = userLabel;
      } else if (currentModelDisplayName && m.displayName === currentModelDisplayName) {
        label = getSelfLabel(locale, m.displayName!);
      } else {
        label = m.displayName || 'AI';
      }
      return `${label}:\n${m.content}`;
    })
    .join('\n\n');
}
