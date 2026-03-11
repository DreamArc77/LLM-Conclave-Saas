import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { logger } from '@/lib/logger';
import type { ChatProxyRequest } from '@/types/api';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const presetId = req.headers.get('x-preset-id');
  let apiKey = req.headers.get('x-api-key');
  const baseUrl = req.headers.get('x-base-url');

  if (presetId) {
    const preset = PRESET_DEFINITIONS.find((p) => p.id === presetId);
    apiKey = preset ? (preset.apiKey || null) : null;
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChatProxyRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { provider, model, messages, system } = body;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const writeSSE = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Run streaming in background — do NOT await
  (async () => {
    try {
      console.log(`[API/chat] provider=${provider} model=${model}`);
      switch (provider) {
        case 'openai-compatible':
          await streamFromOpenAI({ apiKey, baseUrl, model, system, messages, writeSSE });
          break;
        case 'anthropic':
          await streamFromAnthropic({ apiKey, baseUrl, model, system, messages, writeSSE });
          break;
        case 'google-gemini':
          await streamFromGemini({ apiKey, baseUrl, model, system, messages, writeSSE });
          break;
        default:
          await writeSSE({ type: 'error', message: `Unknown provider: ${provider}` });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`[API/chat] Error for ${provider}/${model}:`, err);
      try {
        await writeSSE({ type: 'error', message });
      } catch {
        // Writer may already be closed if client disconnected
      }
    } finally {
      try {
        await writeSSE({ type: 'done' });
        await writer.close();
      } catch {
        // Writer may already be closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
