import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getAuthSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all products with their stocks
    const products = await db.product.findMany({
      include: {
        stocks: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 