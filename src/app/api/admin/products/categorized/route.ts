import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: {
        products: {
          some: {}
        }
      },
      include: {
        products: {
          include: {
            stocks: {
              where: {
                isDelivered: false
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // We need to manually calculate stock counts as Prisma doesn't do it directly
    // in a nested relation count within the same query easily.
    const categoriesWithStockCount = categories.map(category => ({
      ...category,
      products: category.products.map(product => ({
        ...product,
        stockCount: product.stocks.length
      }))
    }));

    return NextResponse.json({ categories: categoriesWithStockCount });
  } catch (error) {
    console.error('[CATEGORIZED_PRODUCTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 