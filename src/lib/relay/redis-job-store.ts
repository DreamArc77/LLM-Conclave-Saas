import { getRedis } from './redis-client';

const EVENT_TTL = 900; // 15 minutes
const POLL_INTERVAL_MS = 150;
const MAX_POLL_MS = 295_000; // 295s — safely under Railway/Vercel 300s limit

const eventsKey = (sid: string) => `relay:${sid}:events`;
const statusKey = (sid: string) => `relay:${sid}:status`;
const abortKey  = (sid: string) => `relay:${sid}:abort`;

export async function createJob(sessionId: string): Promise<void> {
  await getRedis().set(statusKey(sessionId), 'running', { ex: EVENT_TTL });
}

export async function appendJobEvent(sessionId: string, data: object): Promise<void> {
  const redis = getRedis();
  await redis.rpush(eventsKey(sessionId), JSON.stringify(data));
  await redis.expire(eventsKey(sessionId), EVENT_TTL);
}

export async function finishJob(sessionId: string, status: 'done' | 'error'): Promise<void> {
  await getRedis().set(statusKey(sessionId), status, { ex: EVENT_TTL });
}

export async function isJobAborted(sessionId: string): Promise<boolean> {
  return (await getRedis().exists(abortKey(sessionId))) === 1;
}

export async function abortJob(sessionId: string): Promise<void> {
  await getRedis().set(abortKey(sessionId), '1', { ex: EVENT_TTL });
}

export async function getJobStatus(sessionId: string): Promise<string | null> {
  return getRedis().get<string>(statusKey(sessionId));
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
} as const;

export function createJobSSEStream(sessionId: string, fromIndex: number): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const writeEvent = async (data: object) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // client disconnected — ignore
    }
  };

  (async () => {
    const redis = getRedis();
    let cursor = fromIndex;
    const deadline = Date.now() + MAX_POLL_MS;

    try {
      while (Date.now() < deadline) {
        const events = await redis.lrange<string>(eventsKey(sessionId), cursor, -1);
        for (const raw of events) {
          await writeEvent(typeof raw === 'string' ? JSON.parse(raw) : raw);
          cursor++;
        }

        const jobStatus = await getJobStatus(sessionId);
        if (jobStatus !== 'running') break;

        if (events.length === 0) {
          await writeEvent({ type: 'keepalive' });
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
      }
    } finally {
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, { headers: SSE_HEADERS });
}
