import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET() {
  try {
    // Since we don't have isFeatured in the schema, use the first 6 published products
    const products = await prisma.product.findMany({
      where: {
        published: true },
      include: {
        category: true },
      orderBy: {
        createdAt: 'desc' },
      take: 6 });

    // Properly convert Decimal objects to strings to avoid serialization issues
    const serializedProducts = products.map(product => {
      const serialized = {
        ...product,
        price: product.price.toString(), // Explicitly convert price to string
      };
      return serialized;
    });

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
} 