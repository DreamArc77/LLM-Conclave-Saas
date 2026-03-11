import { getJob, createJobSSEStream } from '@/lib/relay/job-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  const from = parseInt(url.searchParams.get('from') || '0', 10);

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const job = getJob(sessionId);
  if (!job) {
    return new Response('Relay not found', { status: 404 });
  }

  return createJobSSEStream(job, from);
}
