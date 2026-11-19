import Anthropic from '@anthropic-ai/sdk';
import { isTruncatedFinishReason } from './truncation';
import type { StreamParams, StreamResult } from './types';

const DEFAULT_MAX_TOKENS = 8192;

export async function streamFromAnthropic({
  apiKey,
  baseUrl,
  model,
  system,
  messages,
  writeSSE,
  onUsage,
  maxTokens,
  onFinish,
}: StreamParams): Promise<StreamResult> {
  const client = new Anthropic({
    apiKey,
    ...(baseUrl ? { baseURL: baseUrl } : {}),
  });

  const anthropicMessages = normalizeForAnthropic(messages);

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: anthropicMessages,
    ...(system ? { system } : {}),
  });

  stream.on('text', async (text) => {
    await writeSSE({ type: 'chunk', content: text });
  });

  const finalMsg = await stream.finalMessage();
  if (onUsage && finalMsg.usage) {
    onUsage({
      inputTokens: finalMsg.usage.input_tokens,
      outputTokens: finalMsg.usage.output_tokens,
    });
  }

  const finishReason = finalMsg.stop_reason ?? undefined;
  const result: StreamResult = {
    finishReason,
    truncated: isTruncatedFinishReason(finishReason),
  };
  onFinish?.(result);
  return result;
}

function normalizeForAnthropic(
  messages: Array<{ role: string; content: string }>
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      // Merge consecutive same-role messages (e.g. multiple assistant responses)
      last.content = (last.content as string) + '\n\n---\n\n' + msg.content;
    } else {
      result.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  return result;
}
