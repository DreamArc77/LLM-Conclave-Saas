/**
 * Job store factory: provides a unified sessionId-based interface.
 *
 * REDIS_DISABLED=true  → in-memory store (single-instance, no Redis needed)
 * REDIS_DISABLED=false → Upstash Redis store (multi-instance safe)
 *
 * All methods take sessionId (string) and are async-safe.
 */

import * as memStore from './job-store';
import * as redisStore from './redis-job-store';

const useInMemory = process.env.REDIS_DISABLED === 'true';

export interface JobStore {
  createJob(sessionId: string): void | Promise<void>;
  appendJobEvent(sessionId: string, data: object): void | Promise<void>;
  finishJob(sessionId: string, status: 'done' | 'error'): void | Promise<void>;
  isJobAborted(sessionId: string): Promise<boolean>;
  abortJob(sessionId: string): void | Promise<void>;
  /** Returns an SSE Response that streams events for this session. */
  createJobSSEStream(sessionId: string, fromIndex: number): Response;
}

const memAdapter: JobStore = {
  createJob(sessionId) {
    memStore.createJob(sessionId);
  },
  appendJobEvent(sessionId, data) {
    const job = memStore.getJob(sessionId);
    if (job) memStore.appendJobEvent(job, data);
  },
  finishJob(sessionId, status) {
    const job = memStore.getJob(sessionId);
    if (job) memStore.finishJob(job, status);
  },
  async isJobAborted(sessionId) {
    return memStore.getJob(sessionId)?.abort.signal.aborted ?? false;
  },
  abortJob(sessionId) {
    memStore.getJob(sessionId)?.abort.abort();
  },
  createJobSSEStream(sessionId, fromIndex) {
    const job = memStore.getJob(sessionId);
    if (!job) return new Response('Relay not found', { status: 404 });
    return memStore.createJobSSEStream(job, fromIndex);
  },
};

const redisAdapter: JobStore = {
  createJob: (sid) => redisStore.createJob(sid),
  appendJobEvent: (sid, data) => redisStore.appendJobEvent(sid, data),
  finishJob: (sid, status) => redisStore.finishJob(sid, status),
  isJobAborted: (sid) => redisStore.isJobAborted(sid),
  abortJob: (sid) => redisStore.abortJob(sid),
  createJobSSEStream: (sid, from) => redisStore.createJobSSEStream(sid, from),
};

export const jobStore: JobStore = useInMemory ? memAdapter : redisAdapter;
