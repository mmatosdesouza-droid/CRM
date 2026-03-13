import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST move card to different list
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { cardId, targetListId, targetOrder } = body ?? {};

    if (!cardId || !targetListId || targetOrder === undefined) {
      return NextResponse.json(
        { error: 'cardId, targetListId, and targetOrder are required' },
        { status: 400 }
      );
    }

    const card = await prisma?.card?.update?.({
      where: { id: cardId ?? '' },
      data: {
        listId: targetListId ?? '',
        order: targetOrder ?? 0,
      },
      include: {
        labels: true,
        contact: { select: { id: true, name: true, phone: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    return NextResponse.json(card ?? null);
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}
