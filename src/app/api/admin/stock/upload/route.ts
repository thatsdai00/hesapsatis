import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getAuthSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const file = formData.get('file') as File;

    if (!productId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read the file content
    const fileContent = await file.text();
    // Handle both \n and \r\n line endings
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'File is empty or contains no valid lines.' }, { status: 400 });
    }

    let successCount = 0;
    
    for (const line of lines) {
      const content = line.trim();
      try {
        await db.stock.create({
          data: {
            productId,
            content,
            isDelivered: false } });
        successCount++;
      } catch (error) {
        // We'll check if the error is due to a unique constraint violation (P2002)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // This is a duplicate entry, we can ignore it and continue.
          console.log(`Skipping duplicate stock item for product ${productId}: ${content}`);
        } else {
          // For other errors, we re-throw to be caught by the outer catch block.
          throw error;
        }
      }
    }

    // Only update the product count if new stock was actually added.
    if (successCount > 0) {
      await db.product.update({
        where: { id: productId },
        data: {
          stockCount: {
            increment: successCount } } });
    }

    const duplicates = lines.length - successCount;
    
    // Log the activity if any stock was added
    if (successCount > 0) {
      // Get product name for better logging
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { name: true }
      });
      
      logActivity({
        type: 'STOCK_ADDED',
        message: `Added ${successCount} stock items to product ${product?.name || productId}`,
        userId: session.user.id }).catch(error => {
        console.error('Failed to log stock upload activity:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${successCount} accounts to stock. Skipped ${duplicates} duplicates.`,
      count: successCount,
      duplicates });
  } catch (error) {
    console.error('Error uploading stock:', error);
    return NextResponse.json(
      { error: 'Failed to upload stock' },
      { status: 500 }
    );
  }
} 