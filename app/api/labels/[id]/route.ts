import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update label
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { name, color } = body ?? {};

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    const label = await prisma?.label?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
    });

    return NextResponse.json(label ?? null);
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
  }
}

// DELETE label
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.label?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
