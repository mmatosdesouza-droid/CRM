import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update list
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { title, order } = body ?? {};

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (order !== undefined) updateData.order = order;

    const list = await prisma?.list?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
    });

    return NextResponse.json(list ?? null);
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE list
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.list?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
