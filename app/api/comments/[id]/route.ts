import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update comment
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { content } = body ?? {};

    const comment = await prisma?.comment?.update?.({
      where: { id: id ?? '' },
      data: { content: content ?? '' },
    });

    return NextResponse.json(comment ?? null);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE comment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.comment?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
