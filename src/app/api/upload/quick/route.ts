import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found' });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const relativeUploadDir = 'images/quick';
  const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${file.name.replace(
      /\.[^/.]+$/,
      ""
    )}-${uniqueSuffix}.${file.type.split('/')[1]}`;
    
    await writeFile(join(uploadDir, filename), buffer);
    
    const fileUrl = `/${relativeUploadDir}/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' });
  }
} 