import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all scheduled messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    
    const where = cardId ? { cardId } : {};
    
    const messages = await prisma.scheduledMessage.findMany({
      where,
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
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled messages' }, { status: 500 });
  }
}

// POST create a new scheduled message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, scheduledAt, cardId, mediaUrl, mediaType, mediaName, cloudStoragePath, isPublic } = body;

    if (!scheduledAt || !cardId) {
      return NextResponse.json({ error: 'scheduledAt and cardId are required' }, { status: 400 });
    }

    // Permitir mensagem vazia se tiver mídia
    if (!message && !mediaUrl && !cloudStoragePath) {
      return NextResponse.json({ error: 'Message or media is required' }, { status: 400 });
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        message: message || '',
        scheduledAt: new Date(scheduledAt),
        cardId,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        mediaName: mediaName || null,
        cloudStoragePath: cloudStoragePath || null,
        isPublic: isPublic ?? true,
      },
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
    console.error('Error creating scheduled message:', error);
    return NextResponse.json({ error: 'Failed to create scheduled message' }, { status: 500 });
  }
}
