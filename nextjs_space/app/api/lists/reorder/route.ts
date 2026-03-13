import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST reorder lists
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { lists } = body ?? {};

    if (!lists || !Array.isArray(lists)) {
      return NextResponse.json({ error: 'Lists array is required' }, { status: 400 });
    }

    // Update each list's order
    await Promise.all(
      (lists ?? []).map((list: any) =>
        prisma?.list?.update?.({
          where: { id: list?.id ?? '' },
          data: { order: list?.order ?? 0 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering lists:', error);
    return NextResponse.json({ error: 'Failed to reorder lists' }, { status: 500 });
  }
}
