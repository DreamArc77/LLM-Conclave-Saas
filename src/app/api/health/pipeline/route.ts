import { checkModelPipeline } from '@/lib/health/pipeline-check';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/pipeline — run the model-pipeline probe on demand.
 * Protected by HEALTH_CHECK_SECRET via header `x-health-secret` or query `?secret=`
 * (query support lets simple uptime monitors call it without custom headers).
 *
 * Returns 200 + { ok: true } when every preset probe passes, 503 with per-model
 * details otherwise. The same check also runs automatically every day and after
 * each deploy (see src/lib/health/pipeline-check.ts).
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.HEALTH_CHECK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'HEALTH_CHECK_SECRET not configured' }, { status: 503 });
  }

  const provided = req.headers.get('x-health-secret') ?? new URL(req.url).searchParams.get('secret');
  if (provided !== secret) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const results = await checkModelPipeline();
  const ok = results.every((r) => r.ok);

  return Response.json({ ok, checkedAt: new Date().toISOString(), results }, { status: ok ? 200 : 503 });
}
