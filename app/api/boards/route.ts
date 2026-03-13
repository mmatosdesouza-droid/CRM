import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all boards
export async function GET() {
  try {
    const boards = await prisma?.board?.findMany?.({
      include: {
        lists: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                labels: true,
                contact: { select: { id: true, name: true, phone: true, email: true } },
                deal: { select: { id: true, title: true, value: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) ?? [];

    return NextResponse.json(boards ?? []);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST create new board
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { title, type } = body ?? {};

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const board = await prisma?.board?.create?.({
      data: {
        title: title ?? '',
        type: type ?? 'tasks',
      },
    });

    return NextResponse.json(board ?? null);
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
