import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET a single scheduled message
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await prisma.scheduledMessage.findUnique({
      where: { id: params.id },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            contact: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching scheduled message:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled message' }, { status: 500 });
  }
}

// PATCH update a scheduled message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { message, scheduledAt, sent, mediaUrl, mediaType, mediaName, cloudStoragePath, isPublic } = body;

    const updateData: any = {};
    if (message !== undefined) updateData.message = message;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (sent !== undefined) updateData.sent = sent;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
    if (mediaType !== undefined) updateData.mediaType = mediaType;
    if (mediaName !== undefined) updateData.mediaName = mediaName;
    if (cloudStoragePath !== undefined) updateData.cloudStoragePath = cloudStoragePath;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const scheduledMessage = await prisma.scheduledMessage.update({
      where: { id: params.id },
      data: updateData,
      include: {
        card: {
          select: {
            id: true,
            title: true,
            contact: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return NextResponse.json(scheduledMessage);
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    return NextResponse.json({ error: 'Failed to update scheduled message' }, { status: 500 });
  }
}

// DELETE a scheduled message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.scheduledMessage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled message' }, { status: 500 });
  }
}
