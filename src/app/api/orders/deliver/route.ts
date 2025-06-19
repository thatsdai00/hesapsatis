import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendOrderDeliveredEmail } from '@/lib/email';

interface StockItem {
  id: string;
  productId: string;
  content: string;
  isDelivered: boolean;
  orderId: string | null;
}

interface OrderItemType {
  id: string;
  productId: string;
  quantity: number;
  product: {
    name: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can manually trigger delivery
    const isAdmin = session.user.role === 'ADMIN';
    
    // Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true
          }
        },
        stocks: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot deliver an order that is not completed' },
        { status: 400 }
      );
    }

    // Check if order is already delivered
    if (order.deliveryStatus === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Order is already delivered' },
        { status: 400 }
      );
    }

    // Check if user is authorized (admin or order owner)
    if (!isAdmin && session.user.id !== order.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process delivery
    let deliverySuccess = true;
    let deliveryMessage = 'Order delivered successfully';
    
    try {
      // Get required stock items for each product in the order
      const stockNeeds = order.orderItems.map((item: OrderItemType) => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      // Find available stock for each product
      const stockAssignments: StockItem[] = [];
      
      for (const need of stockNeeds) {
        // Find available stock for this product
        const availableStock = await db.stock.findMany({
          where: {
            productId: need.productId,
            isDelivered: false,
            orderId: null
          },
          take: need.quantity
        });
        
        if (availableStock.length < need.quantity) {
          throw new Error(`Not enough stock available for product ${need.productId}`);
        }
        
        stockAssignments.push(...availableStock);
      }
      
      // Assign stock to the order and mark as delivered
      for (const stock of stockAssignments) {
        await db.stock.update({
          where: { id: stock.id },
          data: {
            isDelivered: true,
            orderId: order.id
          }
        });
      }
      
      // Update order delivery status
      await db.order.update({
        where: { id: order.id },
        data: {
          deliveryStatus: 'DELIVERED'
        }
      });
      
      // Create delivery log
      await db.deliveryLog.create({
        data: {
          orderId: order.id,
          stockId: stockAssignments[0]?.id || '',
          status: 'SUCCESS',
          message: 'Order delivered successfully'
        }
      });
      
      // Prepare data for email
      const products = order.orderItems.map(item => ({
        productName: item.product.name,
        price: item.price.toString()
      }));
      
      const stockItems = stockAssignments.map(stock => {
        const orderItem = order.orderItems.find((item: OrderItemType) => item.productId === stock.productId);
        return {
          productName: orderItem?.product.name || 'Product',
          content: stock.content
        };
      });
      
      // Send email to customer with their accounts using the template
      await sendOrderDeliveredEmail(
        order.user.email,
        order.user.name || 'Değerli Müşterimiz',
        order.id,
        products,
        stockItems
      ).catch(error => {
        console.error('Failed to send order delivery email:', error);
      });
      
    } catch (error) {
      deliverySuccess = false;
      deliveryMessage = error instanceof Error ? error.message : 'Failed to deliver order';
      
      // Log the failure
      await db.deliveryLog.create({
        data: {
          orderId: order.id,
          stockId: '',
          status: 'FAILED',
          message: deliveryMessage
        }
      });
      
      // Update order status
      await db.order.update({
        where: { id: order.id },
        data: {
          deliveryStatus: 'FAILED'
        }
      });
      
      return NextResponse.json(
        { error: deliveryMessage },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: deliverySuccess,
      message: deliveryMessage
    });
  } catch (error) {
    console.error('Error delivering order:', error);
    return NextResponse.json(
      { error: 'Failed to deliver order' },
      { status: 500 }
    );
  }
} 