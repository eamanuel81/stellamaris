import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const manualRoot = path.resolve(process.cwd(), 'documentacion', 'manuales');

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
};

function safeManualPath(slug: string[] | undefined) {
  const relative = slug?.length ? slug.join('/') : 'index.html';
  const normalized = path.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(manualRoot, normalized);
  if (!fullPath.startsWith(manualRoot)) {
    return null;
  }
  return fullPath;
}

function rewriteManualHtml(html: string) {
  return html
    .replaceAll('../../logotrans-170x83.png', '/manual-assets/logotrans-170x83.png')
    .replaceAll('../../tests/screenshots/', '/manual-test-screenshots/')
    .replaceAll('imagenes/', '/manual-test-screenshots/');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const resolvedParams = await params;
  const fullPath = safeManualPath(resolvedParams.slug);
  if (!fullPath) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = contentTypes[ext] ?? 'application/octet-stream';

    if (ext === '.html') {
      const html = rewriteManualHtml(buffer.toString('utf-8'));
      return new NextResponse(html, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
      });
    }

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Manual file not found' }, { status: 404 });
  }
}
