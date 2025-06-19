import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getAuthSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    
    // Base query with common includes
    const query = {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true } },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true } } } },
        stocks: true,
        deliveryLogs: true },
      orderBy: {
        createdAt: 'desc' as const } };

    // Add status filter if provided
    if (statusFilter) {
      Object.assign(query, {
        where: {
          status: statusFilter } });
    }

    // Fetch orders
    const orders = await db.order.findMany(query);

    return NextResponse.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 