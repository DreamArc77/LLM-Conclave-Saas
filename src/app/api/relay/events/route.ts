import { jobStore } from '@/lib/relay/job-store-factory';
import { requireApiUser } from '@/lib/auth/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  const from = parseInt(url.searchParams.get('from') || '0', 10);

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  return jobStore.createJobSSEStream(sessionId, from);
}
