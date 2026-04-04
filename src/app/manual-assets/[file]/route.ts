import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const allowedFiles: Record<string, { filePath: string; contentType: string }> = {
  'logotrans-170x83.png': {
    filePath: path.resolve(process.cwd(), 'logotrans-170x83.png'),
    contentType: 'image/png',
  },
  'logo.png': {
    filePath: path.resolve(process.cwd(), 'logo.png'),
    contentType: 'image/png',
  },
  'logo-sin-fondo.png': {
    filePath: path.resolve(process.cwd(), 'logo sin fondo.png'),
    contentType: 'image/png',
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const asset = allowedFiles[file];
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  try {
    const buffer = await readFile(asset.filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
