import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(
  req: Request,
  context: RouteContext
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, color, imageUrl, destinationUrl, visible, order } = body;
    const { id } = context.params;

    const updatedItem = await prisma.quickAccessItem.update({
      where: { id },
      data: {
        title,
        color,
        imageUrl,
        destinationUrl,
        visible,
        order 
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  const session = await getAuthSession();

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = context.params;
    await prisma.quickAccessItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 