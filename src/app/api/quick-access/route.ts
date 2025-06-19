import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const quickAccessItems = await prisma.quickAccessItem.findMany({
      where: { visible: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(quickAccessItems);
  } catch (error) {
    console.error('Error fetching quick access items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 