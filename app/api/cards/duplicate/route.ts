import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST duplicate a card
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { cardId } = body ?? {};

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    // Get original card with all details
    const originalCard = await prisma?.card?.findUnique?.({
      where: { id: cardId ?? '' },
      include: {
        labels: true,
        checklists: {
          include: { items: true },
        },
      },
    });

    if (!originalCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get max order in list
    const maxOrder = await prisma?.card?.findFirst?.({
      where: { listId: originalCard?.listId ?? '' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // Create duplicate card
    const duplicateCard = await prisma?.card?.create?.({
      data: {
        title: `${originalCard?.title ?? ''} (cópia)`,
        description: originalCard?.description ?? null,
        listId: originalCard?.listId ?? '',
        order: (maxOrder?.order ?? 0) + 1,
        dueDate: originalCard?.dueDate ?? null,
        coverImageUrl: originalCard?.coverImageUrl ?? null,
        contactId: originalCard?.contactId ?? null,
        dealId: originalCard?.dealId ?? null,
        labels: {
          connect: (originalCard?.labels ?? []).map((label: any) => ({ id: label?.id ?? '' })),
        },
        checklists: {
          create: (originalCard?.checklists ?? []).map((checklist: any) => ({
            title: checklist?.title ?? '',
            order: checklist?.order ?? 0,
            items: {
              create: (checklist?.items ?? []).map((item: any) => ({
                text: item?.text ?? '',
                completed: false,
                order: item?.order ?? 0,
              })),
            },
          })),
        },
      },
      include: {
        labels: true,
        contact: { select: { id: true, name: true, phone: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    return NextResponse.json(duplicateCard ?? null);
  } catch (error) {
    console.error('Error duplicating card:', error);
    return NextResponse.json({ error: 'Failed to duplicate card' }, { status: 500 });
  }
}
