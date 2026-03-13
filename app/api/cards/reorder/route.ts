import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST reorder cards within a list
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { cards } = body ?? {};

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Cards array is required' }, { status: 400 });
    }

    // Update each card's order
    await Promise.all(
      (cards ?? []).map((card: any) =>
        prisma?.card?.update?.({
          where: { id: card?.id ?? '' },
          data: { order: card?.order ?? 0 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering cards:', error);
    return NextResponse.json({ error: 'Failed to reorder cards' }, { status: 500 });
  }
}
