import OpenAI from 'openai';
import type { StreamParams } from './types';

export async function streamFromOpenAI({
  apiKey,
  baseUrl,
  model,
  system,
  messages,
  writeSSE,
}: StreamParams) {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });

  const fullMessages = system
    ? [{ role: 'system' as const, content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))]
    : messages.map((m) => ({ role: m.role, content: m.content }));

  const stream = await client.chat.completions.create({
    model,
    messages: fullMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      await writeSSE({ type: 'chunk', content });
    }
  }
}
