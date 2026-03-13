import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new list
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { title, boardId } = body ?? {};

    if (!title || !boardId) {
      return NextResponse.json({ error: 'Title and boardId are required' }, { status: 400 });
    }

    // Get max order
    const maxOrder = await prisma?.list?.findFirst?.({
      where: { boardId: boardId ?? '' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const list = await prisma?.list?.create?.({
      data: {
        title: title ?? '',
        boardId: boardId ?? '',
        order: (maxOrder?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(list ?? null);
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
