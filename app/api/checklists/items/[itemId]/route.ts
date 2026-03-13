import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update checklist item
export async function PATCH(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const itemId = params?.itemId;
    const body = await request?.json?.();
    const { text, completed } = body ?? {};

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;

    const item = await prisma?.checklistItem?.update?.({
      where: { id: itemId ?? '' },
      data: updateData ?? {},
    });

    return NextResponse.json(item ?? null);
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}

// DELETE checklist item
export async function DELETE(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const itemId = params?.itemId;
    
    await prisma?.checklistItem?.delete?.({
      where: { id: itemId ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}
