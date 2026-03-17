import { createAdminClient } from '@/lib/supabase/server';
import { buildReportHTMLString } from '@/lib/export/report-html';

export const dynamic = 'force-dynamic';

/**
 * Public report viewer — no auth required.
 * Security model: UUID as capability token (anyone with the link can view).
 * Returns a complete styled HTML page with a print-to-PDF button.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const admin = createAdminClient();

  let reportMd: string | null = null;

  const { data: agentReport } = await admin
    .from('agent_reports')
    .select('report_md')
    .eq('session_id', sessionId)
    .single();
  reportMd = agentReport?.report_md ?? null;

  // Fallback: web session summary stored in chat_messages
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

  const baseHtml = await buildReportHTMLString(reportMd);

  // Inject print button (hidden in print media) before </body>
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
<button class="llmc-print-btn" onclick="window.print()">⬇ 下载 PDF</button>
</body>`
  );

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
