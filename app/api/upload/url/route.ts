import { NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST get file URL (public or signed)
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { cloudStoragePath, isPublic = false } = body ?? {};

    if (!cloudStoragePath) {
      return NextResponse.json(
        { error: 'cloudStoragePath is required' },
        { status: 400 }
      );
    }

    const url = await getFileUrl(cloudStoragePath, isPublic);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
  }
}
