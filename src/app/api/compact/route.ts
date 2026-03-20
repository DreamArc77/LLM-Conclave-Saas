import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { logger } from '@/lib/logger';
import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import type { ProviderId } from '@/types/config';

export const dynamic = 'force-dynamic';

interface CompactRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>;
}

export async function POST(req: Request): Promise<Response> {
  let body: CompactRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { messages } = body;
  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'No messages' }), { status: 400 });
  }

  // Select model: prefer Gemini Flash (cost-efficient), same logic as generateSummary
  let apiKey: string | null = null;
  let modelId: string | null = null;
  let providerId: string | null = null;
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

  if (!apiKey || !modelId || !providerId) {
    logger.warn('[API/compact] No model available for compaction');
    return new Response(JSON.stringify({ error: 'No model available' }), { status: 503 });
  }

  const provider = PROVIDER_REGISTRY[providerId as ProviderId];
  if (!provider) {
    return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 500 });
  }

  const resolvedBaseUrl = baseUrl || provider.defaultBaseUrl;

  const conversation = messages
    .map((m) => {
      const label = m.role === 'user' ? 'User' : (m.displayName || 'AI');
      return `${label}:\n${m.content}`;
    })
    .join('\n\n');

  const prompt = `Summarize the following conversation concisely. Capture all key topics discussed, important conclusions, decisions, and information exchanged. Use the same language as the conversation. Keep the summary under 600 words and preserve enough detail that it can serve as context for continuing the conversation.

Conversation:
${conversation}

Summary:`;

  let summary = '';
  const writeSSE = async (data: { type: string; content?: string }) => {
    if (data.type === 'chunk' && data.content) {
      summary += data.content;
    }
  };

  try {
    switch (provider.protocol) {
      case 'openai-compatible':
        await streamFromOpenAI({ apiKey, baseUrl: resolvedBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      case 'anthropic':
        await streamFromAnthropic({ apiKey, baseUrl: resolvedBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      case 'google-gemini':
        await streamFromGemini({ apiKey, baseUrl: resolvedBaseUrl, model: modelId, messages: [{ role: 'user', content: prompt }], writeSSE });
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unsupported protocol' }), { status: 500 });
    }
  } catch (err) {
    logger.error('[API/compact] Compaction LLM call failed:', err);
    return new Response(JSON.stringify({ error: 'LLM call failed' }), { status: 500 });
  }

  if (!summary.trim()) {
    return new Response(JSON.stringify({ error: 'Empty summary' }), { status: 500 });
  }

  return new Response(JSON.stringify({ summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
