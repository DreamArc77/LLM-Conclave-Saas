import { generateReportMarkdown } from '@/lib/report/regenerate';
import type { ConvMessage, VoteContext } from '@/lib/report/regenerate';
import type { VoteResult } from '@/types/chat';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

interface GenerateRequest {
  messages: ConvMessage[];
  query: string;
  locale?: Locale;
  voteResults?: VoteResult[];
  alternatives?: string[];
}

/**
 * POST /api/report/generate
 * Generates a report from conversation messages + optional voting results.
 *
 * Body: { messages: ConvMessage[], query: string, locale?: Locale, voteResults?: VoteResult[], alternatives?: string[] }
 * Response: { markdown: string, filename: string }
 */
export async function POST(request: Request): Promise<Response> {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, query, locale = 'zh-CN', voteResults, alternatives } = body;

  if (!Array.isArray(messages) || !query) {
    return Response.json({ error: 'Provide messages and query' }, { status: 400 });
  }

  const voteCtx: VoteContext | undefined =
    voteResults?.length && alternatives?.length
      ? { alternatives, votes: voteResults }
      : undefined;

  try {
    const markdown = await generateReportMarkdown(messages, query, locale, voteCtx);
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
