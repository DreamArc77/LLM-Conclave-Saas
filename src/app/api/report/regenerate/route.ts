import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { isSaas } from '@/lib/flags';
import { generateReportMarkdown } from '@/lib/report/regenerate';
import type { ConvMessage } from '@/lib/report/regenerate';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

/**
 * POST /api/report/regenerate
 * Regenerates a report in the requested locale.
 *
 * Body (SaaS — server fetches messages):
 *   { sessionId: string, locale: Locale }
 *
 * Body (non-SaaS — client provides messages):
 *   { messages: ConvMessage[], query: string, locale: Locale }
 *
 * Response: { markdown: string, filename: string }
 */
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { locale = 'en', sessionId, messages, query } = body as {
    locale?: Locale;
    sessionId?: string;
    messages?: ConvMessage[];
    query?: string;
  };

  let fullContext: ConvMessage[];
  let originalQuery: string;

  if (sessionId) {
    // Fetch conversation messages from Supabase
    if (isSaas) {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: msgs } = await admin
      .from('chat_messages')
      .select('role, content, display_name')
      .eq('session_id', sessionId)
      .eq('is_system', false)
      .order('created_at', { ascending: true });

    if (!msgs || msgs.length === 0) {
      return Response.json({ error: 'No messages found' }, { status: 404 });
    }

    fullContext = msgs.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
      displayName: (m.display_name as string | null) ?? undefined,
    }));
    originalQuery = (msgs.find((m) => m.role === 'user')?.content as string) ?? '';
  } else if (Array.isArray(messages) && typeof query === 'string') {
    // Non-SaaS: client provides messages directly
    fullContext = messages;
    originalQuery = query;
  } else {
    return Response.json({ error: 'Provide sessionId or messages+query' }, { status: 400 });
  }

  try {
    const markdown = await generateReportMarkdown(fullContext, originalQuery, locale);
    const dateStr = new Date().toISOString().slice(0, 10);
    return Response.json({ markdown, filename: `ai-council-${dateStr}.pdf` });
  } catch (err) {
    console.error('[report/regenerate] Failed:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to regenerate report' },
      { status: 500 },
    );
  }
}
