import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single card with full details
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    const card = await prisma?.card?.findUnique?.({
      where: { id: id ?? '' },
      include: {
        labels: true,
        checklists: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
        comments: { orderBy: { createdAt: 'desc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        scheduledMessages: { orderBy: { scheduledAt: 'asc' } },
        contact: true,
        deal: true,
        list: { select: { id: true, title: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card ?? null);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
  }
}

// PATCH update card
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { title, description, startDate, dueDate, coverImageUrl, contactId, dealId, labelIds } = body ?? {};

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (contactId !== undefined) updateData.contactId = contactId;
    if (dealId !== undefined) updateData.dealId = dealId;

    // Handle label connections
    if (labelIds !== undefined && Array.isArray(labelIds)) {
      updateData.labels = {
        set: (labelIds ?? []).map((labelId: string) => ({ id: labelId })),
      };
    }

    const card = await prisma?.card?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
      include: {
        labels: true,
        contact: { select: { id: true, name: true, phone: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    return NextResponse.json(card ?? null);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE card
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.card?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
