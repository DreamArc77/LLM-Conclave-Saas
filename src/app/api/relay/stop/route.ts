import { getJob } from '@/lib/relay/job-store';

export async function POST(req: Request): Promise<Response> {
  let sessionId: string | undefined;
  try {
    const body = await req.json();
    sessionId = body.sessionId;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const job = getJob(sessionId);
  if (job) {
    job.abort.abort();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
