import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new checklist
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { title, cardId } = body ?? {};

    if (!title || !cardId) {
      return NextResponse.json({ error: 'Title and cardId are required' }, { status: 400 });
    }

    // Get max order
    const maxOrder = await prisma?.checklist?.findFirst?.({
      where: { cardId: cardId ?? '' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const checklist = await prisma?.checklist?.create?.({
      data: {
        title: title ?? '',
        cardId: cardId ?? '',
        order: (maxOrder?.order ?? 0) + 1,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(checklist ?? null);
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
  }
}
