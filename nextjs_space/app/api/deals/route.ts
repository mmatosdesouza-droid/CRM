import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all deals
export async function GET() {
  try {
    const deals = await prisma?.deal?.findMany?.({
      include: {
        labels: true,
        contact: { select: { id: true, name: true, email: true, phone: true } },
        activities: { select: { id: true, type: true, title: true, scheduledAt: true } },
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) ?? [];

    return NextResponse.json(deals ?? []);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST create new deal
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { title, value, status, expectedCloseDate, description, contactId, labelIds } = body ?? {};

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const deal = await prisma?.deal?.create?.({
      data: {
        title: title ?? '',
        value: value ?? 0,
        status: status ?? 'lead',
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        description: description ?? null,
        contactId: contactId ?? null,
        labels: labelIds && Array.isArray(labelIds) ? {
          connect: (labelIds ?? []).map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        labels: true,
        contact: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json(deal ?? null);
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
