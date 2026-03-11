import { marked } from 'marked';
import { getMessages, type Locale } from '@/i18n';

/**
 * Builds a complete standalone HTML document string from markdown.
 * No DOM dependencies — safe to use in Node.js (server-side) and browser alike.
 */
export async function buildReportHTMLString(markdown: string, locale: Locale = 'zh-CN'): Promise<string> {
  const htmlContent = await marked.parse(markdown);
  const msgs = getMessages(locale);
  const dateLocale = msgs.prompts.dateLocale;

  const now = new Date().toLocaleString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #ffffff;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a1a;
    width: 794px;
  }
  .page { padding: 60px 64px; }
  .header {
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid #2563eb;
  }
  .header-label {
    font-size: 11px;
    color: #6b7280;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .header-sub { font-size: 11px; color: #9ca3af; }
  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #9ca3af;
    display: flex;
    justify-content: space-between;
  }
  .minutes-body { font-size: 14px; line-height: 1.9; color: #1f2937; }
  .minutes-body h1 {
    font-size: 22px; font-weight: 700; color: #111827;
    margin: 0 0 20px 0; line-height: 1.4;
  }
  .minutes-body h2 {
    font-size: 15px; font-weight: 700; color: #1e40af;
    margin: 36px 0 14px 0; padding: 10px 14px;
    background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;
  }
  .minutes-body h3 {
    font-size: 14px; font-weight: 600; color: #374151; margin: 20px 0 8px 0;
  }
  .minutes-body p { margin: 0 0 10px 0; color: #374151; }
  .minutes-body ul, .minutes-body ol { margin: 8px 0 12px 0; padding-left: 24px; }
  .minutes-body li { margin-bottom: 4px; color: #374151; }
  .minutes-body strong { color: #111827; font-weight: 600; }
  .minutes-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
  .minutes-body blockquote {
    border-left: 4px solid #2563eb; margin: 14px 0; padding: 8px 16px;
    color: #4b5563; background: #f0f7ff; border-radius: 0 4px 4px 0;
  }
  .minutes-body blockquote p { margin: 0; color: #4b5563; font-style: italic; }
  .minutes-body table {
    border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px;
  }
  .minutes-body th {
    background: #1e40af; color: #ffffff; font-weight: 600;
    padding: 10px 14px; text-align: left; border: 1px solid #1e3a8a;
  }
  .minutes-body td {
    border: 1px solid #cbd5e1; padding: 9px 14px; color: #374151; vertical-align: top;
  }
  .minutes-body tr:nth-child(even) td { background: #f0f7ff; }
  .minutes-body code {
    background: #f3f4f6; padding: 1px 5px; border-radius: 3px;
    font-size: 12px; font-family: "SF Mono", "Consolas", monospace;
  }
  .minutes-body pre {
    background: #f3f4f6; padding: 12px 16px; border-radius: 6px;
    overflow: hidden; white-space: pre-wrap; word-break: break-word; margin: 12px 0;
  }
  .minutes-body pre code { background: none; padding: 0; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-label">${msgs.report.header}</div>
    <div class="header-sub">${msgs.report.subheader}</div>
  </div>
  <div class="minutes-body">${htmlContent}</div>
  <div class="footer">
    <span>${msgs.report.footer}</span>
    <span>${now}</span>
  </div>
</div>
</body>
</html>`;
}
