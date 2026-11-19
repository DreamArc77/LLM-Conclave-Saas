import OpenAI from 'openai';
import { isTruncatedFinishReason } from './truncation';
import type { StreamParams, StreamResult } from './types';

/** OpenRouter-only reasoning controls, not part of the OpenAI SDK type. */
type OpenRouterReasoning = { max_tokens?: number };

export async function streamFromOpenAI({
  apiKey,
  baseUrl,
  model,
  system,
  messages,
  writeSSE,
  onUsage,
  maxTokens,
  reasoningMaxTokens,
  onFinish,
}: StreamParams): Promise<StreamResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });

  const fullMessages = system
    ? [{ role: 'system' as const, content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))]
    : messages.map((m) => ({ role: m.role, content: m.content }));

  const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
    reasoning?: OpenRouterReasoning;
  } = {
    model,
    messages: fullMessages,
    stream: true,
    ...(onUsage ? { stream_options: { include_usage: true } } : {}),
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...(reasoningMaxTokens ? { reasoning: { max_tokens: reasoningMaxTokens } } : {}),
  };

  const stream = await client.chat.completions.create(params);

  let finishReason: string | undefined;
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      await writeSSE({ type: 'chunk', content });
    }
    const reason = chunk.choices?.[0]?.finish_reason;
    if (reason) finishReason = reason;
    if (chunk.usage && onUsage) {
      onUsage({
        inputTokens: chunk.usage.prompt_tokens,
        outputTokens: chunk.usage.completion_tokens,
      });
    }
  }

  const result: StreamResult = {
    finishReason,
    truncated: isTruncatedFinishReason(finishReason),
  };
  onFinish?.(result);
  return result;
}
