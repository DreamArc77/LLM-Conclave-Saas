import type { RelayUsageStats } from '@/types/chat';

export type RelaySSEEvent =
  | { type: 'model_start'; modelIndex: number; displayName: string; round: number }
  | { type: 'content'; text: string }
  | { type: 'model_done'; round: number; modelIndex: number; modelId: string; providerId: string; displayName: string; content: string; finished: boolean }
  | { type: 'summary_start' }
  | { type: 'summary_done'; markdown?: string; elapsedSec: number; filename: string; topic: string; usageStats?: RelayUsageStats }
  | { type: 'relay_done' }
  | { type: 'error'; message: string }
  | { type: 'keepalive' }
  | { type: 'done' };

export async function parseRelayStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: RelaySSEEvent) => Promise<void> | void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data: '));
      if (!dataLine) continue;

      const jsonStr = dataLine.slice(6);
      try {
        const data = JSON.parse(jsonStr) as RelaySSEEvent;
        await onEvent(data);
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('JSON')) {
          throw err;
        }
      }
    }
  }
}

export async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find((line) => line.startsWith('data: '));
      if (!dataLine) continue;

      const jsonStr = dataLine.slice(6);
      try {
        const data = JSON.parse(jsonStr);

        if (data.type === 'chunk' && data.content) {
          fullContent += data.content;
          onChunk(data.content);
        } else if (data.type === 'error') {
          throw new Error(data.message || 'Stream error');
        }
        // 'done' type — just continue, the stream will end naturally
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('JSON')) {
          throw err;
        }
      }
    }
  }

  return fullContent;
}
