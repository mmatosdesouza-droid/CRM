import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new attachment (link or file reference)
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { name, url, cloudStoragePath, isPublic, fileType, fileSize, cardId } = body ?? {};

    if (!name || !cardId) {
      return NextResponse.json({ error: 'Name and cardId are required' }, { status: 400 });
    }

    const attachment = await prisma?.attachment?.create?.({
      data: {
        name: name ?? '',
        url: url ?? null,
        cloudStoragePath: cloudStoragePath ?? null,
        isPublic: isPublic ?? false,
        fileType: fileType ?? null,
        fileSize: fileSize ?? null,
        cardId: cardId ?? '',
      },
    });

    return NextResponse.json(attachment ?? null);
  } catch (error) {
    console.error('Error creating attachment:', error);
    return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 });
  }
}
