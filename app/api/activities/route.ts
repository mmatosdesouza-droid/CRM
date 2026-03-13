import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all activities
export async function GET() {
  try {
    const activities = await prisma?.activity?.findMany?.({
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, value: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) ?? [];

    return NextResponse.json(activities ?? []);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST create new activity
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { type, title, description, scheduledAt, contactId, dealId } = body ?? {};

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
    }

    const activity = await prisma?.activity?.create?.({
      data: {
        type: type ?? 'note',
        title: title ?? '',
        description: description ?? null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        contactId: contactId ?? null,
        dealId: dealId ?? null,
      },
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, value: true, status: true } },
      },
    });

    return NextResponse.json(activity ?? null);
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
