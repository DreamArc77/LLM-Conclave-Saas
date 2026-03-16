import { verifyAgentApiKey } from '@/lib/agent-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { checkAndDeductCredits, refundCredits } from '@/lib/credits/deduct';
import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { MAX_ROUNDS_HARD_LIMIT } from '@/config/credit-packages';
import { SKILL_VERSION, skillVersionHeaders } from '@/lib/agent-skill-version';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

/** How long (ms) a "pending" job blocks new requests for the same user */
const PENDING_TTL_MS = 12 * 60 * 1000; // 12 min (debate max ~5 min + buffer)

interface DebateRequest {
  query: string;
  models?: string[];
  maxRounds?: number;
  locale?: Locale;
}

interface DebateTurn {
  round: number;
  model: string;
  content: string;
}

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// imMessage builder (unchanged)
// ---------------------------------------------------------------------------

function buildImMessage(params: {
  query: string;
  summary: string;
  participants: string[];
  rounds: number;
  elapsedSec: number;
  creditsUsed: number;
  balance: number;
  reportUrl: string;
  locale: Locale;
}): string {
  const { query, summary, participants, rounds, elapsedSec, creditsUsed, balance, reportUrl, locale } = params;

  const lines = summary.split('\n');
  const bullets: string[] = [];
  let inKeySection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^#+\s*(核心结论|关键发现|主要观点|主要结论|结论与建议|Key (Findings|Conclusions)|主要発見|結論)/i)) {
      inKeySection = true;
      continue;
    }
    if (trimmed.startsWith('#')) inKeySection = false;
    if (inKeySection && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
      const bullet = trimmed.replace(/^[-•*]\s*/, '').trim();
      if (bullet && bullet.length > 5) {
        bullets.push(bullet.slice(0, 100));
        if (bullets.length >= 5) break;
      }
    }
  }
  if (bullets.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.length < 10) continue;
      bullets.push(trimmed.slice(0, 100));
      if (bullets.length >= 3) break;
    }
  }

  const bulletsText = bullets.map((b) => `• ${b}`).join('\n');
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  if (locale === 'zh-CN') {
    return [`📋 研讨议题：${query}`, '', `🔑 核心结论：`, bulletsText, '', `👥 参与：${participants.join('、')} | ${rounds}轮 | ${timeStr}`, `💰 消耗：${creditsUsed} credits | 余额：${balance}`, '', `📄 完整报告：${reportUrl}`].join('\n');
  }
  if (locale === 'ja') {
    return [`📋 議題：${query}`, '', `🔑 主な結論：`, bulletsText, '', `👥 参加：${participants.join('、')} | ${rounds}ラウンド | ${timeStr}`, `💰 消費：${creditsUsed} credits | 残高：${balance}`, '', `📄 全文レポート：${reportUrl}`].join('\n');
  }
  return [`📋 Topic: ${query}`, '', `🔑 Key Conclusions:`, bulletsText, '', `👥 Participants: ${participants.join(', ')} | ${rounds} rounds | ${timeStr}`, `💰 Used: ${creditsUsed} credits | Balance: ${balance}`, '', `📄 Full Report: ${reportUrl}`].join('\n');
}

// ---------------------------------------------------------------------------
// POST /api/agent/debate
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const userId = await verifyAgentApiKey(req);
  if (!userId) {
    return Response.json({ error: 'Invalid or missing API key', skillVersion: SKILL_VERSION }, { status: 401, headers: skillVersionHeaders() });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: DebateRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body', skillVersion: SKILL_VERSION }, { status: 400, headers: skillVersionHeaders() });
  }

  const { query, locale = 'zh-CN' } = body;
  if (!query?.trim()) {
    return Response.json({ error: 'Missing required field: query', skillVersion: SKILL_VERSION }, { status: 400, headers: skillVersionHeaders() });
  }

  const admin = createAdminClient();

  // ── 3. Idempotency key check ──────────────────────────────────────────────
  // Agent should send Idempotency-Key header; if not provided we allow the
  // request but the concurrent-limit check below still protects against storms.
  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');

  if (idempotencyKey) {
    const { data: existingJob } = await admin
      .from('agent_debate_jobs')
      .select('status, session_id, result_json')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingJob) {
      // Already completed → return cached result as SSE final event (no charge)
      if (existingJob.status === 'done' && existingJob.result_json) {
        const cached = sseEvent('final', existingJob.result_json);
        return new Response(cached, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Session-Id': existingJob.session_id,
            'X-Idempotent-Replayed': 'true',
          },
        });
      }
      // Still running → tell the agent not to retry
      if (existingJob.status === 'pending') {
        return Response.json(
          { error: 'DEBATE_ALREADY_RUNNING', message: 'A debate with this idempotency key is already in progress. Wait for it to complete.', sessionId: existingJob.session_id, skillVersion: SKILL_VERSION },
          { status: 409, headers: skillVersionHeaders() }
        );
      }
      // status === 'error' → fall through and allow a fresh attempt with same key
    }
  }

  // ── 4. Per-user concurrent limit (max 1 active debate) ───────────────────
  // This is the hard safety net against retry storms regardless of idempotency key.
  const pendingSince = new Date(Date.now() - PENDING_TTL_MS).toISOString();
  const { data: activeJobs } = await admin
    .from('agent_debate_jobs')
    .select('session_id, created_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('created_at', pendingSince)
    .order('created_at', { ascending: false })
    .limit(1);

  if (activeJobs && activeJobs.length > 0) {
    return Response.json(
      { error: 'DEBATE_ALREADY_RUNNING', message: 'You already have a debate in progress. Wait for it to complete before starting a new one.', activeSessionId: activeJobs[0].session_id, skillVersion: SKILL_VERSION },
      { status: 409, headers: skillVersionHeaders() }
    );
  }

  // ── 5. Resolve models ─────────────────────────────────────────────────────
  const maxRounds = Math.min(body.maxRounds ?? 3, MAX_ROUNDS_HARD_LIMIT);
  const availablePresets = PRESET_DEFINITIONS.filter((p) => p.apiKey);
  let selectedPresets = body.models?.length
    ? availablePresets.filter((p) => body.models!.includes(p.id))
    : availablePresets.filter((p) => (p.agentMeta?.tier === 'standard' || p.agentMeta?.tier === 'lite') && p.defaultEnabled);

  if (selectedPresets.length === 0) selectedPresets = availablePresets.slice(0, 3);
  if (selectedPresets.length === 0) {
    return Response.json({ error: 'No models available', skillVersion: SKILL_VERSION }, { status: 503, headers: skillVersionHeaders() });
  }

  // ── 6. Credit check ───────────────────────────────────────────────────────
  const { data: creditRow } = await admin.from('credits').select('balance').eq('user_id', userId).maybeSingle();
  const currentBalance = (creditRow?.balance as number) ?? 0;
  const totalCost = maxRounds * selectedPresets.reduce((sum, p) => sum + p.creditsPerRound, 0);

  if (currentBalance < Math.max(1, totalCost)) {
    return Response.json(
      { error: 'CREDITS_INSUFFICIENT', required: totalCost, balance: currentBalance, topUpUrl: `${APP_URL}/account`, skillVersion: SKILL_VERSION },
      { status: 402, headers: skillVersionHeaders() }
    );
  }

  // ── 7. Reserve job slot (write pending record BEFORE deducting credits) ───
  const sessionId = crypto.randomUUID();
  const jobKey = idempotencyKey ?? sessionId; // use sessionId as fallback key

  const { error: insertErr } = await admin.from('agent_debate_jobs').insert({
    idempotency_key: jobKey,
    user_id: userId,
    session_id: sessionId,
    status: 'pending',
    credits_deducted: totalCost,
  });

  if (insertErr) {
    // Race condition: another request just inserted the same idempotency key
    return Response.json(
      { error: 'DEBATE_ALREADY_RUNNING', message: 'A debate with this idempotency key just started. Please wait.', skillVersion: SKILL_VERSION },
      { status: 409, headers: skillVersionHeaders() }
    );
  }

  // ── 8. Deduct credits ─────────────────────────────────────────────────────
  const deductResult = await checkAndDeductCredits({ userId, cost: totalCost, relaySessionId: sessionId, supabase: admin });
  if (!deductResult.ok) {
    await admin.from('agent_debate_jobs').update({ status: 'error', error_msg: 'Credit deduction failed' }).eq('idempotency_key', jobKey);
    return Response.json(
      { error: 'CREDITS_INSUFFICIENT', required: totalCost, balance: currentBalance, topUpUrl: `${APP_URL}/account`, skillVersion: SKILL_VERSION },
      { status: 402, headers: skillVersionHeaders() }
    );
  }

  // ── 9. Build SSE stream ───────────────────────────────────────────────────
  const participants = selectedPresets.map((p) => p.displayName);
  const internalSecret = process.env.INTERNAL_RELAY_SECRET;

  if (!internalSecret) {
    await admin.from('agent_debate_jobs').update({ status: 'error', error_msg: 'Server misconfiguration' }).eq('idempotency_key', jobKey);
    await refundCredits({ userId, amount: totalCost, relaySessionId: sessionId, supabase: admin }).catch(() => {});
    return Response.json({ error: 'Server misconfiguration: INTERNAL_RELAY_SECRET not set', skillVersion: SKILL_VERSION }, { status: 500, headers: skillVersionHeaders() });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const enqueue = (event: string, data: unknown) => {
        try { controller.enqueue(enc.encode(sseEvent(event, data))); } catch { /* client disconnected */ }
      };

      // Send start event immediately — Cloudflare sees data and won't 524
      enqueue('start', {
        skillVersion: SKILL_VERSION,
        sessionId,
        estimatedSec: maxRounds * selectedPresets.length * 30,
        creditsReserved: totalCost,
        participants,
        rounds: maxRounds,
      });

      // Heartbeat every 15s keeps connection alive through proxies
      const startTime = Date.now();
      const heartbeatInterval = setInterval(() => {
        enqueue('heartbeat', { elapsed: Math.floor((Date.now() - startTime) / 1000) });
      }, 15_000);

      let actualCost = 0;

      try {
        const relayRes = await fetch(`${APP_URL}/api/relay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-agent-user-id': userId,
            'x-agent-secret': internalSecret,
          },
          body: JSON.stringify({
            sessionId,
            query,
            maxRounds,
            models: selectedPresets.map((p) => ({
              id: p.id,
              modelId: p.modelId,
              providerId: p.providerId,
              displayName: p.displayName,
              isPreset: true,
              baseUrl: p.baseUrl,
            })),
            priorContext: [],
            locale,
          }),
        });

        if (!relayRes.ok) {
          const err = await relayRes.json().catch(() => ({}));
          throw new Error(err.error ?? 'Relay failed');
        }

        // Consume relay SSE stream
        const debate: DebateTurn[] = [];
        let summary = '';
        let elapsedSec = 0;
        let inSummary = false;

        const reader = relayRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            let event: Record<string, unknown>;
            try { event = JSON.parse(raw); } catch { continue; }

            if (event.type === 'model_done') {
              inSummary = false;
              const turn = { round: (event.round as number) + 1, model: event.displayName as string, content: event.content as string };
              debate.push(turn);
              enqueue('round_done', { round: turn.round, model: turn.model });
            } else if (event.type === 'summary_start') {
              inSummary = true;
            } else if (event.type === 'content' && inSummary) {
              summary += (event.text as string) ?? '';
            } else if (event.type === 'summary_done') {
              inSummary = false;
              elapsedSec = (event.elapsedSec as number) ?? 0;
              const stats = event.usageStats as Record<string, unknown> | undefined;
              if (stats?.totalCreditCost) actualCost = stats.totalCreditCost as number;
              break outer;
            } else if (event.type === 'done') {
              break outer;
            } else if (event.type === 'error') {
              throw new Error(event.message as string);
            }
          }
        }

        clearInterval(heartbeatInterval);

        // Refund unused credits
        if (totalCost > actualCost && actualCost > 0) {
          await refundCredits({ userId, amount: totalCost - actualCost, relaySessionId: sessionId, supabase: admin });
        }

        const { data: updatedCredits } = await admin.from('credits').select('balance').eq('user_id', userId).maybeSingle();
        const newBalance = (updatedCredits?.balance as number) ?? 0;
        const creditsUsed = actualCost > 0 ? actualCost : totalCost;
        const reportUrl = `${APP_URL}/api/agent/reports/${sessionId}`;

        await admin.from('agent_reports').insert({ session_id: sessionId, user_id: userId, report_md: summary });

        const imMessage = buildImMessage({ query, summary, participants, rounds: maxRounds, elapsedSec, creditsUsed, balance: newBalance, reportUrl, locale });
        const result = { sessionId, imMessage, debate, summary, reportUrl, creditsUsed, balance: newBalance, participants, elapsedSec };

        // Cache result and release job slot
        await admin.from('agent_debate_jobs').update({ status: 'done', result_json: result }).eq('idempotency_key', jobKey);

        enqueue('final', result);
      } catch (err) {
        clearInterval(heartbeatInterval);
        const message = err instanceof Error ? err.message : 'Internal error';

        await refundCredits({ userId, amount: totalCost - actualCost, relaySessionId: sessionId, supabase: admin }).catch(() => {});
        await admin.from('agent_debate_jobs').update({ status: 'error', error_msg: message }).eq('idempotency_key', jobKey);

        enqueue('error', { error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Session-Id': sessionId,
    },
  });
}
