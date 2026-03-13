import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all contacts
export async function GET() {
  try {
    const contacts = await prisma?.contact?.findMany?.({
      include: {
        labels: true,
        deals: { select: { id: true, title: true, value: true, status: true } },
        activities: { select: { id: true, type: true, title: true, scheduledAt: true } },
        _count: {
          select: { activities: true, deals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) ?? [];

    return NextResponse.json(contacts ?? []);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST create new contact
export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { name, email, phone, company, notes, labelIds } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const contact = await prisma?.contact?.create?.({
      data: {
        name: name ?? '',
        email: email ?? null,
        phone: phone ?? null,
        company: company ?? null,
        notes: notes ?? null,
        labels: labelIds && Array.isArray(labelIds) ? {
          connect: (labelIds ?? []).map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        labels: true,
      },
    });

    return NextResponse.json(contact ?? null);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
