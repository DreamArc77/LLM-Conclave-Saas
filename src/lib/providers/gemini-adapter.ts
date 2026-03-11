import { GoogleGenAI } from '@google/genai';
import { logger } from '@/lib/logger';
import type { StreamParams } from './types';

const STREAM_TIMEOUT_MS = 60_000; // 60s timeout for Gemini streaming

export async function streamFromGemini({
  apiKey,
  baseUrl,
  model,
  system,
  messages,
  writeSSE,
  onUsage,
}: StreamParams) {
  const options: ConstructorParameters<typeof GoogleGenAI>[0] = { apiKey };
  if (baseUrl) {
    options.httpOptions = { baseUrl };
  }

  const ai = new GoogleGenAI(options);

  // Relay-engine already ensures messages end with a user turn.
  // Just convert roles: assistant → model
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  console.log('[Gemini] Request:', { model, baseUrl: baseUrl || '(default)', turns: contents.length });

  const generateParams: Parameters<typeof ai.models.generateContentStream>[0] = { model, contents };
  if (system) {
    generateParams.config = { systemInstruction: system };
  }

  try {
    const response = await withTimeout(
      ai.models.generateContentStream(generateParams),
      STREAM_TIMEOUT_MS,
      `Gemini API did not respond within ${STREAM_TIMEOUT_MS / 1000}s`
    );

    let chunkCount = 0;
    let lastUsageMetadata: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        chunkCount++;
        await writeSSE({ type: 'chunk', content: text });
      }
      if (chunk.usageMetadata) {
        lastUsageMetadata = chunk.usageMetadata;
      }
    }
    if (onUsage && lastUsageMetadata) {
      onUsage({
        inputTokens: lastUsageMetadata.promptTokenCount ?? 0,
        outputTokens: lastUsageMetadata.candidatesTokenCount ?? 0,
      });
    }
    console.log(`[Gemini] Stream completed: ${chunkCount} chunks`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[Gemini] Error:', err);

    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      throw new Error(
        `Failed to connect to Google Gemini API. If you are in a region where Google is blocked, ` +
        `please set a custom Endpoint URL (proxy). Original error: ${message}`
      );
    }
    if (message.includes('not found') || message.includes('NOT_FOUND')) {
      throw new Error(
        `Model "${model}" not found. Please check the model ID. ` +
        `Available models include: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash. ` +
        `Original error: ${message}`
      );
    }
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(msg)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}
