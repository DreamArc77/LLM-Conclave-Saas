import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function buildReportContainer(markdownContent: string, locale: Locale = 'zh-CN'): Promise<HTMLDivElement> {
  const htmlContent = await marked.parse(markdownContent);
  const msgs = getMessages(locale);

  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: 794px;
    background: #ffffff;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1a1a1a;
    box-sizing: border-box;
  `;

  const dateLocale = locale === 'ja' ? 'ja-JP' : locale === 'en' ? 'en-US' : 'zh-CN';
  const now = new Date().toLocaleString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  container.innerHTML = `
    <div style="padding: 60px 64px;">
      <div style="margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
        <div style="font-size: 11px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">${msgs.report.header}</div>
        <div style="font-size: 11px; color: #9ca3af;">${msgs.report.subheader}</div>
      </div>

      <div class="minutes-body" style="
        font-size: 14px;
        line-height: 1.9;
        color: #1f2937;
      ">
        ${htmlContent}
      </div>

      <div style="
        margin-top: 48px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        font-size: 11px;
        color: #9ca3af;
        display: flex;
        justify-content: space-between;
      ">
        <span>${msgs.report.footer}</span>
        <span>${now}</span>
      </div>
    </div>

    <style>
      .minutes-body h1 {
        font-size: 22px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 20px 0;
        line-height: 1.4;
      }
      .minutes-body h2 {
        font-size: 15px;
        font-weight: 700;
        color: #1e40af;
        margin: 36px 0 14px 0;
        padding: 10px 14px;
        background: #eff6ff;
        border-left: 4px solid #2563eb;
        border-radius: 4px;
      }
      .minutes-body h3 {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 20px 0 8px 0;
      }
      .minutes-body p {
        margin: 0 0 10px 0;
        color: #374151;
      }
      .minutes-body ul, .minutes-body ol {
        margin: 8px 0 12px 0;
        padding-left: 24px;
      }
      .minutes-body li {
        margin-bottom: 4px;
        color: #374151;
      }
      .minutes-body strong {
        color: #111827;
        font-weight: 600;
      }
      .minutes-body hr {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 28px 0;
      }
      .minutes-body blockquote {
        border-left: 4px solid #2563eb;
        margin: 14px 0;
        padding: 8px 16px;
        color: #4b5563;
        background: #f0f7ff;
        border-radius: 0 4px 4px 0;
      }
      .minutes-body blockquote p {
        margin: 0;
        color: #4b5563;
        font-style: italic;
      }
      .minutes-body table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
        font-size: 13px;
      }
      .minutes-body th {
        background: #1e40af;
        color: #ffffff;
        font-weight: 600;
        padding: 10px 14px;
        text-align: left;
        border: 1px solid #1e3a8a;
      }
      .minutes-body td {
        border: 1px solid #cbd5e1;
        padding: 9px 14px;
        color: #374151;
        vertical-align: top;
      }
      .minutes-body tr:nth-child(even) td {
        background: #f0f7ff;
      }
      .minutes-body code {
        background: #f3f4f6;
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 12px;
        font-family: "SF Mono", "Consolas", monospace;
      }
      .minutes-body pre {
        background: #f3f4f6;
        padding: 12px 16px;
        border-radius: 6px;
        overflow: hidden;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 12px 0;
      }
      .minutes-body pre code {
        background: none;
        padding: 0;
      }
    </style>
  `;

  document.body.appendChild(container);

  // Compact metadata paragraphs (between h1 and first hr)
  const bodyDiv = container.querySelector('.minutes-body');
  const firstHr = bodyDiv?.querySelector('hr');
  if (bodyDiv && firstHr) {
    let sib = bodyDiv.querySelector('h1')?.nextElementSibling;
    while (sib && sib !== firstHr) {
      if (sib.tagName === 'P')
        (sib as HTMLElement).style.cssText = 'margin:4px 0;font-size:13px;color:#4b5563;';
      sib = sib.nextElementSibling;
    }
  }

  return container;
}

// Builds jsPDF from a canvas, applying smart h2-aware page breaking.
// Returns the jsPDF instance. Container must already be in DOM with h2s rendered.
function buildPDFFromCanvas(
  canvas: HTMLCanvasElement,
  sectionBreaks: number[]
): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;
  const pageHeightPx = (pdfHeight / pdfWidth) * imgWidthPx;

  let pageStart = 0;
  let firstPage = true;

  while (pageStart < imgHeightPx) {
    if (!firstPage) pdf.addPage();
    firstPage = false;

    const naturalEnd = pageStart + pageHeightPx;
    const dangerZone = pageStart + pageHeightPx * 0.80;
    const breakInDanger = sectionBreaks.find((y) => y > dangerZone && y < naturalEnd);
    const pageEnd = breakInDanger !== undefined
      ? Math.max(breakInDanger - 10, pageStart + pageHeightPx * 0.5)
      : Math.min(naturalEnd, imgHeightPx);

    const sliceH = Math.round(pageEnd - pageStart);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidthPx;
    sliceCanvas.height = sliceH;
    sliceCanvas.getContext('2d')!.drawImage(
      canvas, 0, pageStart, imgWidthPx, sliceH, 0, 0, imgWidthPx, sliceH
    );

    const sliceHeightMM = (sliceH / imgWidthPx) * pdfWidth;
    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, sliceHeightMM);
    pageStart = pageEnd;
  }

  return pdf;
}

// Returns a PDF blob without triggering a download (used by Web Share API on iOS).
export async function generatePDFBlob(markdownContent: string, locale: Locale = 'zh-CN'): Promise<Blob> {
  const container = await buildReportContainer(markdownContent, locale);
  // iOS: scale:1 to avoid canvas memory crash (scale:2 is 4× larger)
  const SCALE = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 1 : 2;
  const containerRect = container.getBoundingClientRect();
  const sectionBreaks: number[] = [];
  container.querySelectorAll('.minutes-body h2').forEach((el) => {
    const rect = el.getBoundingClientRect();
    sectionBreaks.push((rect.top - containerRect.top) * SCALE);
  });
  try {
    const canvas = await withTimeout(
      html2canvas(container, { scale: SCALE, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 794 }),
      30_000,
      'html2canvas(PDF)'
    );
    return buildPDFFromCanvas(canvas, sectionBreaks).output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

// Returns a PNG blob without triggering a download (used by Web Share API on iOS).
export async function generatePNGBlob(markdownContent: string, locale: Locale = 'zh-CN'): Promise<Blob> {
  const container = await buildReportContainer(markdownContent, locale);
  const scale = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 1 : 2;
  try {
    const canvas = await withTimeout(
      html2canvas(container, { scale, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 794 }),
      30_000,
      'html2canvas(PNG)'
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png'
      )
    );
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportMeetingMinutesPDF(
  markdownContent: string,
  filename: string,
  locale: Locale = 'zh-CN'
): Promise<void> {
  const container = await buildReportContainer(markdownContent, locale);

  // Query h2 positions for smart page breaking (before html2canvas renders)
  const SCALE = 2;
  const containerRect = container.getBoundingClientRect();
  const sectionBreaks: number[] = [];
  container.querySelectorAll('.minutes-body h2').forEach((el) => {
    const rect = el.getBoundingClientRect();
    sectionBreaks.push((rect.top - containerRect.top) * SCALE);
  });

  try {
    const canvas = await html2canvas(container, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    buildPDFFromCanvas(canvas, sectionBreaks).save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportMeetingMinutesPNG(
  markdownContent: string,
  filename: string,
  locale: Locale = 'zh-CN'
): Promise<void> {
  const container = await buildReportContainer(markdownContent, locale);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  } finally {
    document.body.removeChild(container);
  }
}
