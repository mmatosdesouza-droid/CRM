import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update checklist
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { title } = body ?? {};

    const checklist = await prisma?.checklist?.update?.({
      where: { id: id ?? '' },
      data: { title: title ?? '' },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(checklist ?? null);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}

// DELETE checklist
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.checklist?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
