import Anthropic from '@anthropic-ai/sdk';
import type { StreamParams } from './types';

export async function streamFromAnthropic({
  apiKey,
  baseUrl,
  model,
  system,
  messages,
  writeSSE,
  onUsage,
}: StreamParams) {
  const client = new Anthropic({
    apiKey,
    ...(baseUrl ? { baseURL: baseUrl } : {}),
  });

  const anthropicMessages = normalizeForAnthropic(messages);

  const stream = client.messages.stream({
    model,
    max_tokens: 8192,
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
