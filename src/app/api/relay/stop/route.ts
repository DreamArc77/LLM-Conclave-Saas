import { jobStore } from '@/lib/relay/job-store-factory';
import { requireApiUser } from '@/lib/auth/api-auth';

export async function POST(req: Request): Promise<Response> {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

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

  await jobStore.abortJob(sessionId);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
