import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    // Log authentication details for debugging
    console.log('Upload API - Session data:', JSON.stringify({
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        role: session.user.role
      } : null
    }));
    
    if (!session?.user) {
      console.error('Upload failed: No authenticated user');
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 });
    }
    
    // Verify the user exists in the database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      });
      
      if (!dbUser) {
        console.error(`Upload failed: User ${session.user.id} not found in database`);
        return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
      }
      
      if (dbUser.role !== 'ADMIN') {
        console.error(`Upload failed: User role ${dbUser.role} is not ADMIN`);
        return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 });
      }
    } catch (dbError) {
      console.error('Database error when verifying user:', dbError);
      return NextResponse.json({ 
        error: 'Database error when verifying user',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      console.error('Upload failed: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['products', 'logos', 'sliders', 'categories'].includes(type)) {
      console.error(`Upload failed: Invalid file type "${type}"`);
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    console.log(`Processing upload: ${file.name} (${file.size} bytes) for type ${type}`);

    // Get file extension and create a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    // Define the upload directory based on the type
    const uploadDir = join(process.cwd(), 'public', 'images', type);
    console.log(`Upload directory: ${uploadDir}`);

    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to the filesystem
    const filePath = join(uploadDir, fileName);
    console.log(`Writing file to: ${filePath}`);
    await writeFile(filePath, buffer);
    console.log(`File written successfully to ${filePath}`);

    // Return the URL path for the uploaded file
    const fileUrl = `/images/${type}/${fileName}`;
    console.log(`Returning URL: ${fileUrl}`);
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    // Return a more detailed error message
    return NextResponse.json({ 
      error: 'Error uploading file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Increase the limit for the request body size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 