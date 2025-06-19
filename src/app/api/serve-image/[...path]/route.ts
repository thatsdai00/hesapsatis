import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { promises as fs } from 'fs';

// This endpoint is a temporary solution for serving local images during development.
// For production, a dedicated file storage service (e.g., AWS S3) is recommended.
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = join(process.cwd(), 'public', 'images', ...params.path);

  try {
    const file = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: { 'Content-Type': mimeType } });
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}

function getMimeType(filePath: string): string {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.gif')) return 'image/gif';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
} 