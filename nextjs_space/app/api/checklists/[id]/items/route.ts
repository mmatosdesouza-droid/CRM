import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create checklist item
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const checklistId = params?.id;
    const body = await request?.json?.();
    const { text } = body ?? {};

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get max order
    const maxOrder = await prisma?.checklistItem?.findFirst?.({
      where: { checklistId: checklistId ?? '' },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await prisma?.checklistItem?.create?.({
      data: {
        text: text ?? '',
        checklistId: checklistId ?? '',
        order: (maxOrder?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(item ?? null);
  } catch (error) {
    console.error('Error creating checklist item:', error);
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
}
