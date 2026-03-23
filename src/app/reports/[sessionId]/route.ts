import { createAdminClient } from '@/lib/supabase/server';
import { buildReportHTMLString } from '@/lib/export/report-html';
import { generateReportMarkdown } from '@/lib/report/regenerate';
import type { Locale } from '@/i18n';

function detectLocale(req: Request): Locale {
  const accept = req.headers.get('accept-language') ?? '';
  if (/\bja\b/i.test(accept)) return 'ja';
  if (/zh/i.test(accept)) return 'zh-CN';
  return 'en';
}

export const dynamic = 'force-dynamic';

// In-memory cache to avoid re-running the LLM on every page refresh.
// Keyed by "sessionId:locale". Lives as long as the server process.
const regeneratedCache = new Map<string, string>();

/**
 * Public report viewer — no auth required.
 * Security model: UUID as capability token (anyone with the link can view).
 *
 * Accepts optional ?locale= query param. When provided, the report content is
 * regenerated in that language using the session's conversation messages.
 * Falls back to the stored report_markdown if regeneration fails or no messages.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const url = new URL(req.url);
  const localeParam = url.searchParams.get('locale') as Locale | null;
  const locale: Locale = (localeParam && ['en', 'zh-CN', 'ja'].includes(localeParam))
    ? localeParam
    : detectLocale(req);

  const admin = createAdminClient();

  // Check regeneration cache first
  const cacheKey = `${sessionId}:${locale}`;
  let reportMd = regeneratedCache.get(cacheKey) ?? null;

  if (!reportMd) {
    // Try regeneration from conversation messages (web sessions)
    const { data: msgs } = await admin
      .from('chat_messages')
      .select('role, content, display_name')
      .eq('session_id', sessionId)
      .eq('is_system', false)
      .order('created_at', { ascending: true });

    if (msgs && msgs.length > 0) {
      const fullContext = msgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        displayName: (m.display_name as string | null) ?? undefined,
      }));
      const query = (msgs.find((m) => m.role === 'user')?.content as string) ?? '';

      try {
        reportMd = await generateReportMarkdown(fullContext, query, locale);
        regeneratedCache.set(cacheKey, reportMd);
      } catch {
        // Regeneration failed — fall through to stored report
      }
    }
  }

  // Fallback: stored report markdown
  if (!reportMd) {
    const { data: agentReport } = await admin
      .from('agent_reports')
      .select('report_md')
      .eq('session_id', sessionId)
      .single();
    reportMd = agentReport?.report_md ?? null;
  }

  if (!reportMd) {
    const { data: msgReport } = await admin
      .from('chat_messages')
      .select('report_markdown')
      .eq('session_id', sessionId)
      .eq('is_system', true)
      .not('report_markdown', 'is', null)
      .maybeSingle();
    reportMd = (msgReport?.report_markdown as string | null) ?? null;
  }

  if (!reportMd) {
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found</title></head>
      <body style="font-family:sans-serif;padding:60px;text-align:center;color:#6b7280">
        <h2>Report not found</h2><p>The report may have been deleted or the link is invalid.</p>
      </body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const baseHtml = await buildReportHTMLString(reportMd, locale);

  const printLabel = locale === 'zh-CN' ? '⬇ 下载 PDF'
    : locale === 'ja' ? '⬇ PDF をダウンロード'
    : '⬇ Download PDF';

  const html = baseHtml.replace(
    '</body>',
    `<style>
  .llmc-print-btn {
    position: fixed; top: 16px; right: 16px;
    background: #2563eb; color: #fff; border: none;
    padding: 8px 18px; border-radius: 6px; font-size: 13px;
    cursor: pointer; font-family: inherit; box-shadow: 0 1px 4px rgba(0,0,0,.15);
    z-index: 999;
  }
  .llmc-print-btn:hover { background: #1d4ed8; }
  @media print { .llmc-print-btn { display: none !important; } }
</style>
<button class="llmc-print-btn" onclick="window.print()">${printLabel}</button>
</body>`
  );

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
