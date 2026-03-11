import { jobStore } from '@/lib/relay/job-store-factory';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  const from = parseInt(url.searchParams.get('from') || '0', 10);

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  return jobStore.createJobSSEStream(sessionId, from);
}
