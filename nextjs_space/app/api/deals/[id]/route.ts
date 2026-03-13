import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single deal
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    const deal = await prisma?.deal?.findUnique?.({
      where: { id: id ?? '' },
      include: {
        labels: true,
        contact: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal ?? null);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

// PATCH update deal
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { title, value, status, expectedCloseDate, description, contactId, labelIds } = body ?? {};

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (value !== undefined) updateData.value = value;
    if (status !== undefined) updateData.status = status;
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (description !== undefined) updateData.description = description;
    if (contactId !== undefined) updateData.contactId = contactId;

    if (labelIds !== undefined && Array.isArray(labelIds)) {
      updateData.labels = {
        set: (labelIds ?? []).map((labelId: string) => ({ id: labelId })),
      };
    }

    const deal = await prisma?.deal?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
      include: {
        labels: true,
        contact: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json(deal ?? null);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

// DELETE deal
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.deal?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
