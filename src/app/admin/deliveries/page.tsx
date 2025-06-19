import AutoDeliveryClient, { Category } from '@/components/admin/AutoDeliveryClient';
import DeliveryStatusPanel from '@/components/admin/DeliveryStatusPanel';
import { db } from '@/lib/db';

async function getCategorizedProducts(): Promise<Category[]> {
  try {
    const categoriesData = await db.category.findMany({
      where: {
        products: {
          some: {}
        }
      },
      include: {
        products: {
          include: {
            stocks: true
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

    const categoriesWithFullStockInfo: Category[] = categoriesData.map(category => ({
      ...category,
      image: category.image || undefined,
      products: category.products.map(product => ({
        ...product,
        image: product.image || undefined,
        stockCount: product.stocks.length,
      })),
    }));

    return categoriesWithFullStockInfo;
  } catch (error) {
    console.error("Failed to fetch categorized products:", error);
    return [];
  }
}

export default async function AutoDeliveryPage() {
  const categories = await getCategorizedProducts();

  return (
    <div className="space-y-8">
      <div className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Auto Delivery System</h1>
          <p className="text-gray-400 text-sm">
            Upload stock files for each product and monitor delivery status.
          </p>
        </div>
        <AutoDeliveryClient initialCategories={categories} />
      </div>

      {/* Delivery Status Section */}
      <div className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Delivery Status</h2>
          <p className="text-gray-400 text-sm">
            Monitor the status of automated deliveries
          </p>
        </div>
        <DeliveryStatusPanel />
      </div>
    </div>
  );
} 