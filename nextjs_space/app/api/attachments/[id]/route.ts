import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// DELETE attachment
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    // Get attachment to check if it has cloudStoragePath
    const attachment = await prisma?.attachment?.findUnique?.({
      where: { id: id ?? '' },
    });

    if (attachment?.cloudStoragePath) {
      // Delete from S3
      try {
        await deleteFile(attachment.cloudStoragePath);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }

    // Delete from database
    await prisma?.attachment?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
