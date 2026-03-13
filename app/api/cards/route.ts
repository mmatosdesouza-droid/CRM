import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new card
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { title, listId, description, contactId, dealId } = body ?? {};

    if (!title || !listId) {
      return NextResponse.json({ error: 'Title and listId are required' }, { status: 400 });
    }

    // Get max order in list
    const maxOrder = await prisma?.card?.findFirst?.({
      where: { listId: listId ?? '' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const card = await prisma?.card?.create?.({
      data: {
        title: title ?? '',
        listId: listId ?? '',
        description: description ?? null,
        contactId: contactId ?? null,
        dealId: dealId ?? null,
        order: (maxOrder?.order ?? 0) + 1,
      },
      include: {
        labels: true,
        contact: { select: { id: true, name: true, phone: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    return NextResponse.json(card ?? null);
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
