import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeDecimals } from '@/lib/decimal-helper';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        showOnHomepage: true,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        products: {
          where: {
            published: true,
          },
          take: 8,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Properly convert Decimal objects to strings to avoid serialization issues
    const serializedCategories = categories.map(category => ({
      ...category,
      products: category.products.map(product => ({
        ...product,
        price: product.price.toString(), // Explicitly convert price to string
      })),
    }));

    return NextResponse.json(serializedCategories);
  } catch (error) {
    console.error('Error fetching homepage categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage categories' },
      { status: 500 }
    );
  }
} 