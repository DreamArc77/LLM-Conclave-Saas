import { verifyAgentApiKey } from '@/lib/agent-auth';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userId = await verifyAgentApiKey(req);
  if (!userId) {
    return Response.json({ error: 'Invalid or missing API key' }, { status: 401 });
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
    return Response.json({ error: 'Report not found' }, { status: 404 });
  }

  return new Response(data.report_md as string, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${sessionId}.md"`,
    },
  });
}
