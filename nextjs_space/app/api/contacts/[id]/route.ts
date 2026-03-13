import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single contact
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    const contact = await prisma?.contact?.findUnique?.({
      where: { id: id ?? '' },
      include: {
        labels: true,
        deals: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact ?? null);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

// PATCH update contact
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    const body = await request?.json?.();
    const { name, email, phone, company, notes, labelIds } = body ?? {};

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (notes !== undefined) updateData.notes = notes;

    if (labelIds !== undefined && Array.isArray(labelIds)) {
      updateData.labels = {
        set: (labelIds ?? []).map((labelId: string) => ({ id: labelId })),
      };
    }

    const contact = await prisma?.contact?.update?.({
      where: { id: id ?? '' },
      data: updateData ?? {},
      include: {
        labels: true,
      },
    });

    return NextResponse.json(contact ?? null);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE contact
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    
    await prisma?.contact?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
