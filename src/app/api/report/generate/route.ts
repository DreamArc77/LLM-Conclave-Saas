import { generateReportMarkdown } from '@/lib/report/regenerate';
import type { ConvMessage } from '@/lib/report/regenerate';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

interface GenerateRequest {
  messages: ConvMessage[];
  query: string;
  locale?: Locale;
}

/**
 * POST /api/report/generate
 * Generates a report from conversation messages.
 *
 * Body: { messages: ConvMessage[], query: string, locale?: Locale }
 * Response: { markdown: string, filename: string }
 */
export async function POST(request: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, query, locale = 'zh-CN' } = body;

  if (!Array.isArray(messages) || !query) {
    return Response.json({ error: 'Provide messages and query' }, { status: 400 });
  }

  try {
    const markdown = await generateReportMarkdown(messages, query, locale);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `ai-council-${dateStr}.pdf`;
    return Response.json({ markdown, filename });
  } catch (err) {
    console.error('[report/generate] Failed:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to generate report' },
      { status: 500 },
    );
  }
}
