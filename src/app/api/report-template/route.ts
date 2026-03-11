import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'AI智囊团专题研讨交付MD.md');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('Template file not found', { status: 404 });
  }
}
