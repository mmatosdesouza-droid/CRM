import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all labels
export async function GET() {
  try {
    const labels = await prisma?.label?.findMany?.({
      orderBy: { createdAt: 'asc' },
    }) ?? [];

    return NextResponse.json(labels ?? []);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

// POST create new label
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { name, color } = body ?? {};

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    const label = await prisma?.label?.create?.({
      data: {
        name: name ?? '',
        color: color ?? '#000000',
      },
    });

    return NextResponse.json(label ?? null);
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}
