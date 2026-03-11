import { buildReportHTMLString } from '@/lib/export/report-html';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

interface ExportRequest {
  markdown: string;
  format: 'pdf' | 'png';
  filename: string;
  locale?: string;
}

export async function POST(req: Request): Promise<Response> {
  let body: ExportRequest;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { markdown, format, locale } = body;
  if (!markdown || !format) {
    return new Response('Missing markdown or format', { status: 400 });
  }

  const chromiumPath =
    process.env.CHROMIUM_PATH ||
    '/usr/bin/chromium-browser';

  let puppeteer: typeof import('puppeteer-core');
  try {
    puppeteer = await import('puppeteer-core');
  } catch {
    return new Response('puppeteer-core not installed on server', { status: 500 });
  }

  const safeLocale = (['en', 'zh-CN', 'ja'] as Locale[]).includes(locale as Locale)
    ? (locale as Locale)
    : 'zh-CN';
  const html = await buildReportHTMLString(markdown, safeLocale);

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    if (format === 'png') {
      const data = await page.screenshot({ type: 'png', fullPage: true });
      // Buffer.from converts Uint8Array<ArrayBufferLike> to Node.js Buffer (BodyInit-compatible)
      return new Response(Buffer.from(data), {
        headers: { 'Content-Type': 'image/png' },
      });
    } else {
      const data = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return new Response(Buffer.from(data), {
        headers: { 'Content-Type': 'application/pdf' },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    console.error('[API/export] Error:', err);
    return new Response(message, { status: 500 });
  } finally {
    await browser?.close().catch(() => {});
  }
}
