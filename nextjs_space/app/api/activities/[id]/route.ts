import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single activity
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    const activity = await prisma?.activity?.findUnique?.({
      where: { id: id ?? '' },
      include: {
        contact: true,
        deal: true,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json(activity ?? null);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

// PATCH update activity
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { type, title, description, scheduledAt, completedAt, contactId, dealId } = body ?? {};

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (contactId !== undefined) updateData.contactId = contactId;
    if (dealId !== undefined) updateData.dealId = dealId;

    const activity = await prisma?.activity?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, value: true, status: true } },
      },
    });

    return NextResponse.json(activity ?? null);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

// DELETE activity
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.activity?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
