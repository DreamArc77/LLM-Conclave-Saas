import { createServerClient } from '@/lib/supabase/server';
import type { ChatMessage } from '@/types/chat';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('source')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

  if (session.source === 'agent') {
    const { data: report } = await supabase
      .from('agent_reports')
      .select('report_md')
      .eq('session_id', id)
      .single();

    const messages: ChatMessage[] = report?.report_md
      ? [{ id: `${id}-summary`, sessionId: id, role: 'assistant', content: '', isSystem: true, reportMarkdown: report.report_md, timestamp: 0 }]
      : [];
    return Response.json({ messages });
  }

  // Web session — load from chat_messages
  const { data: rows } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: true });

  const messages: ChatMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    role: r.role,
    content: r.content,
    modelId: r.model_id ?? undefined,
    displayName: r.display_name ?? undefined,
    timestamp: r.timestamp,
    isError: r.is_error ?? false,
    isSystem: r.is_system ?? false,
    reportMarkdown: r.report_markdown ?? undefined,
    usageStats: r.usage_stats ?? undefined,
  }));

  return Response.json({ messages });
}
