import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const screenshotsRoot = path.resolve(process.cwd(), 'tests', 'screenshots');
const manualImagesRoot = path.resolve(process.cwd(), 'documentacion', 'manuales', 'imagenes');

function isSafeFileName(file: string) {
  return /^[a-zA-Z0-9._-]+$/.test(file);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!isSafeFileName(file)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const candidates = [
    path.resolve(screenshotsRoot, file),
    path.resolve(manualImagesRoot, file),
  ];

  for (const filePath of candidates) {
    const isInsideAllowed =
      filePath.startsWith(screenshotsRoot) || filePath.startsWith(manualImagesRoot);
    if (!isInsideAllowed) continue;

    try {
      const buffer = await readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
}
