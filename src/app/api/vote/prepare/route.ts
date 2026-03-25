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
      return `Based on the following AI council discussion about "${query}", identify 2 to 4 clear and distinct positions or directions that emerged.

Return ONLY a JSON array of strings. Each string represents one distinct stance or direction — faithful to what was argued in the discussion. If opposing views emerged, reflect them. No explanation, no markdown, just the raw JSON array.

Example output format:
["Position A", "Position B", "Position C"]

Discussion:
${conversation}`;

    case 'ja':
      return `「${query}」に関する以下のAI評議会の議論をもとに、浮かび上がった2〜4つの明確で独自の立場や方向性を特定してください。

JSONの文字列配列のみを返してください。各文字列は議論で主張された一つの立場や方向性を表します。対立する意見があれば忠実に反映してください。説明不要、Markdown不要、生のJSON配列のみ返してください。

出力例：
["立場A", "立場B", "立場C"]

議論内容：
${conversation}`;

    default: // zh-CN
      return `根据以下关于「${query}」的AI议会讨论内容，归纳出 2 到 4 个清晰、独特的立场或方向。

只返回 JSON 字符串数组，不要任何解释或 Markdown，直接返回原始 JSON 数组。每个字符串代表一个独立的立场或方向，忠实反映讨论中出现的观点，如有对立观点请如实体现。

输出格式示例：
["立场或方向A", "立场或方向B", "立场或方向C"]

讨论内容：
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
