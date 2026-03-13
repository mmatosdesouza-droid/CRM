import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST get presigned upload URL
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { fileName, contentType, isPublic = false } = body ?? {};

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
