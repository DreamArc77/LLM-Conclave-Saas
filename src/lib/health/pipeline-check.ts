import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { isSaas } from '@/lib/flags';
import { logger } from '@/lib/logger';

/**
 * Daily model-pipeline health check + webhook alerting.
 *
 * Motivation (2026-11-03 incident): the production OPENROUTER_API_KEY was
 * silently revoked; every debate failed with 401 "User not found" until a user
 * reported it. This module probes the real provider pipeline on a schedule so
 * key / credit / model failures surface within a day instead of via users.
 *
 * Alert destination is PIPELINE_ALERT_WEBHOOK (Feishu / DingTalk / WeCom /
 * Slack / Telegram / Bark, or any endpoint accepting {"text": "..."}).
 * The same check is exposed for manual/external use at GET /api/health/pipeline.
 */

export type PipelineCheckKind =
  | 'ok'
  | 'key-invalid'
  | 'credits-out'
  | 'model-missing'
  | 'rate-limited'
  | 'upstream-error'
  | 'network-error'
  | 'config-error';

export interface PipelineCheckResult {
  /** preset id, or 'config' for server-config checks */
  id: string;
  displayName: string;
  modelId: string;
  ok: boolean;
  kind: PipelineCheckKind;
  detail: string;
}

const PROBE_TIMEOUT_MS = 20_000;
const PROBE_MAX_TOKENS = 16;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 90_000;
/** Repeated failure alerts are throttled so a crash-looping deploy can't spam */
const FAILURE_ALERT_MIN_GAP_MS = 30 * 60 * 1000;
/** Healthy startup pings are throttled so routine redeploys stay quiet */
const HEALTHY_PING_MIN_GAP_MS = 6 * 60 * 60 * 1000;

const KIND_LABELS: Record<PipelineCheckKind, string> = {
  ok: '正常',
  'key-invalid': 'API key 无效/被拒',
  'credits-out': '账户余额不足',
  'model-missing': '模型已下线',
  'rate-limited': '限流（key 本身有效）',
  'upstream-error': '上游错误',
  'network-error': '网络错误',
  'config-error': '服务端配置错误',
};

// ---------------------------------------------------------------------------
// Probes
// ---------------------------------------------------------------------------

function beijingTime(): string {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

async function extractErrorDetail(res: Response): Promise<string> {
  const raw = await res.text().catch(() => '');
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return (parsed.error?.message ?? parsed.message ?? raw).slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}

/**
 * Key-validity pre-check via OpenRouter's free GET /auth/key endpoint
 * (no tokens billed). Returns false only on definitive auth rejection —
 * other statuses (e.g. 404 on gateways without this endpoint) don't block
 * the per-model probes.
 */
async function probeKeyValidity(baseUrl: string, apiKey: string): Promise<{ valid: boolean; detail: string }> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/key`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (res.ok) return { valid: true, detail: '' };
    if (res.status === 401 || res.status === 403) {
      return { valid: false, detail: `${res.status} ${await extractErrorDetail(res)}`.trim() };
    }
    return { valid: true, detail: `auth/key 探测返回 ${res.status}，跳过预检` };
  } catch (err) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? '超时' : (err as Error).message;
    return { valid: true, detail: `auth/key 探测网络失败（${reason}），继续逐模型探测` };
  }
}

async function probeModel(
  preset: (typeof PRESET_DEFINITIONS)[number]
): Promise<PipelineCheckResult> {
  const base = {
    id: preset.id,
    displayName: preset.displayName,
    modelId: preset.modelId,
  };
  try {
    const res = await fetch(`${preset.baseUrl!.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${preset.apiKey}`,
      },
      body: JSON.stringify({
        model: preset.modelId,
        messages: [{ role: 'user', content: 'Reply with OK only.' }],
        max_tokens: PROBE_MAX_TOKENS,
        stream: false,
      }),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (res.ok) return { ...base, ok: true, kind: 'ok', detail: '' };

    const detail = await extractErrorDetail(res);
    switch (res.status) {
      case 401:
      case 403:
        return { ...base, ok: false, kind: 'key-invalid', detail: `${res.status} ${detail}`.trim() };
      case 402:
        return { ...base, ok: false, kind: 'credits-out', detail: detail || '余额不足' };
      case 404:
        return { ...base, ok: false, kind: 'model-missing', detail: detail || '模型不存在' };
      case 429:
        // Key is valid and billed — throttling alone doesn't mean the pipeline is broken
        return { ...base, ok: true, kind: 'rate-limited', detail: detail || '限流' };
      default:
        return { ...base, ok: false, kind: 'upstream-error', detail: `${res.status} ${detail}`.trim() };
    }
  } catch (err) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? '超时' : (err as Error).message;
    return { ...base, ok: false, kind: 'network-error', detail: reason };
  }
}

export async function checkModelPipeline(): Promise<PipelineCheckResult[]> {
  const results: PipelineCheckResult[] = [];

  if (isSaas && !process.env.INTERNAL_RELAY_SECRET) {
    results.push({
      id: 'config',
      displayName: '服务端配置',
      modelId: 'INTERNAL_RELAY_SECRET',
      ok: false,
      kind: 'config-error',
      detail: '未设置 INTERNAL_RELAY_SECRET，/api/agent/debate 会返回 500',
    });
  }

  const keyed = PRESET_DEFINITIONS.filter((p) => p.apiKey && p.baseUrl);
  if (keyed.length === 0) return results;

  // One pre-check per unique (baseUrl, apiKey) group — all presets currently
  // share one OpenRouter key, so an invalid key is detected with a single
  // free request and the model probes are skipped.
  const groups = new Map<string, { baseUrl: string; apiKey: string; presets: typeof keyed }>();
  for (const p of keyed) {
    const groupKey = `${p.baseUrl}::${p.apiKey}`;
    const group = groups.get(groupKey);
    if (group) group.presets.push(p);
    else groups.set(groupKey, { baseUrl: p.baseUrl!, apiKey: p.apiKey, presets: [p] });
  }

  for (const group of groups.values()) {
    const host = new URL(group.baseUrl).host;
    const keyTail = group.apiKey.slice(-4);
    const precheck = await probeKeyValidity(group.baseUrl, group.apiKey);

    if (!precheck.valid) {
      for (const p of group.presets) {
        results.push({
          id: p.id,
          displayName: p.displayName,
          modelId: p.modelId,
          ok: false,
          kind: 'key-invalid',
          detail: `${host} key（尾号 ${keyTail}）被拒绝：${precheck.detail}`,
        });
      }
      continue;
    }

    for (const p of group.presets) {
      results.push(await probeModel(p));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Webhook alerting
// ---------------------------------------------------------------------------

function formatWebhookPayload(url: string, text: string): Record<string, unknown> {
  const host = new URL(url).host;
  if (host.includes('feishu.cn') || host.includes('larksuite')) {
    return { msg_type: 'text', content: { text } };
  }
  if (host.includes('dingtalk.com')) {
    return { msgtype: 'text', text: { content: text } };
  }
  if (host.includes('qyapi.weixin.qq.com')) {
    return { msgtype: 'text', text: { content: text } };
  }
  if (host.includes('slack.com')) {
    return { text };
  }
  if (host.includes('telegram.org')) {
    const chatId = new URL(url).searchParams.get('chat_id');
    return chatId ? { chat_id: chatId, text } : { text };
  }
  return { text };
}

/**
 * Fan-out alert. Email is opt-in per call: failure alerts enable it, while the
 * healthy canary / recovery notices go to the webhook only so the inbox stays
 * quiet when everything is fine.
 */
export async function sendPipelineAlert(text: string, options: { email?: boolean } = {}): Promise<void> {
  const emailEnabled = options.email !== false;
  const [webhookSent, emailSent] = await Promise.all([
    sendPipelineAlertWebhook(text),
    emailEnabled ? sendPipelineAlertEmail(text) : Promise.resolve(false),
  ]);
  if (!webhookSent && !(emailEnabled && emailSent)) {
    const channels = emailEnabled ? 'webhook 与邮件均' : 'webhook';
    logger.error(`[PipelineCheck] 告警未送达（${channels}未配置或失败），内容如下：\n` + text);
  }
}

async function sendPipelineAlertWebhook(text: string): Promise<boolean> {
  const url = process.env.PIPELINE_ALERT_WEBHOOK;
  if (!url) return false;
  try {
    let res: Response;
    if (host(url).includes('day.app')) {
      // Bark: GET https://api.day.app/<key>/<message>
      res = await fetch(`${url.replace(/\/$/, '')}/${encodeURIComponent(text)}`, {
        signal: AbortSignal.timeout(10_000),
      });
    } else {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatWebhookPayload(url, text)),
        signal: AbortSignal.timeout(10_000),
      });
    }
    if (!res.ok) {
      logger.error(`[PipelineCheck] 告警 webhook 返回 ${res.status}：`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    logger.error('[PipelineCheck] 告警 webhook 发送失败:', err);
    return false;
  }
}

/**
 * Email channel via Resend (https://resend.com) — plain fetch, no SDK needed.
 * Requires RESEND_API_KEY + PIPELINE_ALERT_EMAIL; optional PIPELINE_ALERT_EMAIL_FROM
 * (defaults to Resend's shared testing sender — set it to an address on your
 * own verified domain in production).
 */
async function sendPipelineAlertEmail(text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.PIPELINE_ALERT_EMAIL;
  if (!apiKey && !to) return false;
  if (apiKey && !to) {
    logger.warn('[PipelineCheck] 已设置 RESEND_API_KEY 但未设置 PIPELINE_ALERT_EMAIL，邮件告警未发送');
    return false;
  }
  if (!apiKey && to) {
    logger.warn('[PipelineCheck] 已设置 PIPELINE_ALERT_EMAIL 但未设置 RESEND_API_KEY，邮件告警未发送');
    return false;
  }

  const subject = text.split('\n')[0];
  const from = process.env.PIPELINE_ALERT_EMAIL_FROM || 'LLM Conclave <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.error(`[PipelineCheck] 告警邮件返回 ${res.status}：`, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    logger.error('[PipelineCheck] 告警邮件发送失败:', err);
    return false;
  }
}

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Scheduler — started from src/instrumentation.ts (server runtime only)
// ---------------------------------------------------------------------------

let schedulerStarted = false;
let lastOverall: 'ok' | 'fail' | null = null;
let lastFailureAlertAt = 0;
let lastHealthyPingAt = 0;

export function startPipelineScheduler(): void {
  if (schedulerStarted) return;
  if (!PRESET_DEFINITIONS.some((p) => p.apiKey)) {
    logger.info('[PipelineCheck] 无预设模型 key（BYOK 模式），每日巡检未启动');
    return;
  }
  schedulerStarted = true;
  logger.info(`[PipelineCheck] 每日模型链路巡检已启动（启动自检延迟 ${STARTUP_DELAY_MS / 1000}s）`);
  setTimeout(() => void runScheduledCheck('startup'), STARTUP_DELAY_MS);
  setInterval(() => void runScheduledCheck('daily'), CHECK_INTERVAL_MS);
}

async function runScheduledCheck(trigger: 'startup' | 'daily'): Promise<void> {
  let results: PipelineCheckResult[];
  try {
    results = await checkModelPipeline();
  } catch (err) {
    logger.error('[PipelineCheck] 巡检本身执行失败:', err);
    return;
  }

  const failures = results.filter((r) => !r.ok);
  const okCount = results.length - failures.length;
  const now = Date.now();

  if (failures.length > 0) {
    lastOverall = 'fail';
    if (now - lastFailureAlertAt < FAILURE_ALERT_MIN_GAP_MS) {
      logger.warn('[PipelineCheck] 巡检失败，但距上次告警不足 30 分钟，跳过重复告警');
      return;
    }
    lastFailureAlertAt = now;
    const lines = failures.slice(0, 6).map((f) => `• ${f.displayName}（${f.modelId}）：${KIND_LABELS[f.kind]}${f.detail ? ` — ${f.detail}` : ''}`);
    const text = [
      '🚨 LLM Conclave 模型链路巡检失败',
      `时间：${beijingTime()}（UTC+8）`,
      `触发：${trigger === 'startup' ? '部署后自检' : '每日巡检'}`,
      '问题：',
      ...lines,
      failures.length > 6 ? `…等共 ${failures.length} 项` : '',
      '建议：检查 openrouter.ai 的 key 状态与账户余额；更换后更新 Railway 环境变量 OPENROUTER_API_KEY 并重新部署',
    ].filter(Boolean).join('\n');
    logger.error(`[PipelineCheck] 巡检失败（${failures.length}/${results.length} 项异常）`);
    await sendPipelineAlert(text);
    return;
  }

  const recovered = lastOverall === 'fail';
  lastOverall = 'ok';
  if (recovered) {
    await sendPipelineAlert(`✅ LLM Conclave 模型链路已恢复\n${okCount}/${results.length} 预设模型探针通过\n时间：${beijingTime()}（UTC+8）`, { email: false });
    lastHealthyPingAt = now;
    return;
  }
  if (trigger === 'startup' && now - lastHealthyPingAt >= HEALTHY_PING_MIN_GAP_MS) {
    // Canary ping: proves the alerter itself works after each deploy (webhook only)
    await sendPipelineAlert(`✅ LLM Conclave 启动自检通过：${okCount}/${results.length} 预设模型可用\n时间：${beijingTime()}（UTC+8）`, { email: false });
    lastHealthyPingAt = now;
  }
}
