import { verifyAgentApiKey } from '@/lib/agent-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { SKILL_VERSION, skillVersionHeaders } from '@/lib/agent-skill-version';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userId = await verifyAgentApiKey(req);
  if (!userId) {
    return Response.json({ error: 'Invalid or missing API key', skillVersion: SKILL_VERSION }, { status: 401, headers: skillVersionHeaders() });
  }

  const { sessionId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('agent_reports')
    .select('report_md')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Report not found', skillVersion: SKILL_VERSION }, { status: 404, headers: skillVersionHeaders() });
  }

  return new Response(data.report_md as string, {
    headers: {
      ...skillVersionHeaders(),
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${sessionId}.md"`,
    },
  });
}
