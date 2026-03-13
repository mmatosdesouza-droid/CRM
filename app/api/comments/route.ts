import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new comment
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { content, cardId } = body ?? {};

    if (!content || !cardId) {
      return NextResponse.json({ error: 'Content and cardId are required' }, { status: 400 });
    }

    const comment = await prisma?.comment?.create?.({
      data: {
        content: content ?? '',
        cardId: cardId ?? '',
      },
    });

    return NextResponse.json(comment ?? null);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
