import { EventEmitter } from 'events';

export interface RelayJob {
  events: object[];
  status: 'running' | 'done' | 'error';
  emitter: EventEmitter;
  abort: AbortController;
}

const jobs = new Map<string, RelayJob>();

export function createJob(sessionId: string): RelayJob {
  const job: RelayJob = {
    events: [],
    status: 'running',
    emitter: new EventEmitter(),
    abort: new AbortController(),
  };
  job.emitter.setMaxListeners(20);
  jobs.set(sessionId, job);
  // Auto-cleanup after 15 minutes
  setTimeout(() => jobs.delete(sessionId), 15 * 60 * 1000);
  return job;
}

export function getJob(sessionId: string): RelayJob | undefined {
  return jobs.get(sessionId);
}

export function appendJobEvent(job: RelayJob, data: object) {
  job.events.push(data);
  job.emitter.emit('event', data);
}

export function finishJob(job: RelayJob, status: 'done' | 'error') {
  job.status = status;
  job.emitter.emit('end');
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
} as const;

export function createJobSSEStream(job: RelayJob, fromIndex: number): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const writeEvent = (data: object) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)).catch(() => {
      // Client disconnected — unsubscribe from emitter; relay keeps running
      job.emitter.off('event', onEvent);
      job.emitter.off('end', onEnd);
    });
  };

  // Replay buffered events
  for (let i = fromIndex; i < job.events.length; i++) {
    writeEvent(job.events[i]);
  }

  // If relay already finished, close immediately
  if (job.status !== 'running') {
    writer.close().catch(() => {});
    return new Response(readable, { headers: SSE_HEADERS });
  }

  const onEvent = (data: object) => writeEvent(data);
  const onEnd = () => {
    job.emitter.off('event', onEvent);
    writer.close().catch(() => {});
  };

  job.emitter.on('event', onEvent);
  job.emitter.once('end', onEnd);

  return new Response(readable, { headers: SSE_HEADERS });
}
