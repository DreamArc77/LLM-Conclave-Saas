import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import type { ProviderId } from '@/types/config';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

interface PrepareRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>;
  query: string;
  locale?: Locale;
}

function getAlternativesPrompt(
  locale: Locale,
  query: string,
  conversation: string,
): string {
  switch (locale) {
    case 'en':
      return `You are a meeting facilitator. Based on the following discussion about "${query}", generate 2-4 decision options for a vote.

Steps:
1. Identify points of consensus across participants — merge these into a shared foundation (no need to vote on what everyone agrees on)
2. Identify the core points of disagreement — these become the basis for distinct voting options
3. Each option should represent a complete, actionable decision direction that a decision-maker could choose and execute

Return ONLY a JSON array of strings. No explanation, no markdown:
["Option A", "Option B", "Option C"]

Discussion:
${conversation}`;

    case 'ja':
      return `あなたは会議進行役です。「${query}」に関する以下の議論をもとに、意思決定者が投票できる2〜4つの選択肢を生成してください。

手順：
1. 参加者間の合意点を特定する（合意事項は共通前提としてまとめる — 合意点に投票は不要）
2. 核心的な対立点・意見の相違を特定し、それを投票選択肢の軸にする
3. 各選択肢は、意思決定者が選んで実行できる完全な方向性を表すこと

JSONの文字列配列のみを返してください。説明・Markdown不要：
["選択肢A", "選択肢B", "選択肢C"]

議論内容：
${conversation}`;

    default: // zh-CN
      return `你是一名会议记录专员。请根据以下关于「${query}」的讨论，为决策者生成 2-4 个可供投票的决策选项。

步骤：
1. 识别讨论中各方的共识点 —— 将共识合并为共同前提（无需为共识单独设投票项）
2. 识别核心分歧点 —— 围绕分歧点设计投票选项
3. 每个选项应代表一种完整、可执行的决策方向，而非单一观点的复述；选项之间应存在实质性差异

只返回 JSON 字符串数组，直接输出，不要解释、不要 Markdown：
["选项A", "选项B", "选项C"]

讨论记录：
${conversation}`;
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: PrepareRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, query, locale = 'zh-CN' } = body;
  if (!messages?.length || !query) {
    return Response.json({ error: 'Missing messages or query' }, { status: 400 });
  }

  // Select model (prefer Gemini Flash)
  let apiKey: string | null = null;
  let modelId = '';
  let providerId = '';
  let baseUrl: string | undefined;

  const geminiPreset = PRESET_DEFINITIONS.find((p) => p.id === 'Gemini');
  if (geminiPreset?.apiKey) {
    apiKey = geminiPreset.apiKey;
    modelId = geminiPreset.modelId;
    providerId = geminiPreset.providerId;
    baseUrl = geminiPreset.baseUrl;
  } else {
    for (const preset of PRESET_DEFINITIONS) {
      if (preset.apiKey) {
        apiKey = preset.apiKey;
        modelId = preset.modelId;
        providerId = preset.providerId;
        baseUrl = preset.baseUrl;
        break;
      }
    }
  }

  if (!apiKey) return Response.json({ error: 'No model available' }, { status: 503 });

  const provider = PROVIDER_REGISTRY[providerId as ProviderId];
  if (!provider) return Response.json({ error: 'Provider not found' }, { status: 503 });

  const userLabel = locale === 'en' ? 'User' : locale === 'ja' ? 'ユーザー' : '用户';
  const conversation = messages
    .map((m) => `${m.role === 'user' ? userLabel : (m.displayName || 'AI')}:\n${m.content}`)
    .join('\n\n');

  const prompt = getAlternativesPrompt(locale, query, conversation);

  let rawOutput = '';
  const writeSSE = async (data: { type: string; content?: string }) => {
    if (data.type === 'chunk' && data.content) rawOutput += data.content;
  };

  try {
    const effectiveBaseUrl = baseUrl || provider.defaultBaseUrl;
    switch (provider.protocol) {
      case 'openai-compatible':
        await streamFromOpenAI({ apiKey, baseUrl: effectiveBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      case 'anthropic':
        await streamFromAnthropic({ apiKey, baseUrl: effectiveBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      case 'google-gemini':
        await streamFromGemini({ apiKey, baseUrl: effectiveBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      default:
        throw new Error('Unknown provider protocol');
    }
  } catch (err) {
    console.error('[vote/prepare] LLM call failed:', err);
    return Response.json({ error: 'LLM call failed' }, { status: 500 });
  }

  // Parse the JSON array from the LLM output
  let alternatives: string[] = [];
  try {
    const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      alternatives = JSON.parse(jsonMatch[0]) as string[];
    }
  } catch {
    // fallback: split by newline if JSON parsing fails
    alternatives = rawOutput
      .split('\n')
      .map((l) => l.replace(/^["'\d.\-\s*]+/, '').replace(/["',]+$/, '').trim())
      .filter((l) => l.length > 10)
      .slice(0, 4);
  }

  // Clamp to 2-4 alternatives
  alternatives = alternatives.slice(0, 4);
  if (alternatives.length < 2) {
    return Response.json({ error: 'Could not extract alternatives' }, { status: 500 });
  }

  return Response.json({ alternatives });
}
