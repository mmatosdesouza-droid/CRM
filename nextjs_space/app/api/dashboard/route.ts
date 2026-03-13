import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET dashboard metrics
export async function GET() {
  try {
    // Total contacts
    const totalContacts = await prisma?.contact?.count?.() ?? 0;

    // Open deals (lead, in_progress)
    const openDeals = await prisma?.deal?.count?.({
      where: {
        status: { in: ['lead', 'in_progress'] },
      },
    }) ?? 0;

    // Total value of open deals
    const deals = await prisma?.deal?.findMany?.({
      where: {
        status: { in: ['lead', 'in_progress'] },
      },
      select: { value: true },
    }) ?? [];
    const totalValue = (deals ?? []).reduce((sum, deal) => sum + (deal?.value ?? 0), 0);

    // Pending tasks (cards without due date past or today)
    const now = new Date();
    const pendingTasks = await prisma?.card?.count?.({
      where: {
        OR: [
          { dueDate: null },
          { dueDate: { gte: now } },
        ],
      },
    }) ?? 0;

    // Upcoming tasks (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingTasks = await prisma?.card?.findMany?.({
      where: {
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        list: { select: { title: true } },
      },
    }) ?? [];

    // Recent activities (last 10)
    const recentActivities = await prisma?.activity?.findMany?.({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: { select: { name: true } },
        deal: { select: { title: true } },
      },
    }) ?? [];

    // Deals closing soon (next 14 days)
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    const closingDeals = await prisma?.deal?.findMany?.({
      where: {
        expectedCloseDate: {
          gte: now,
          lte: fourteenDaysFromNow,
        },
        status: { in: ['lead', 'in_progress'] },
      },
      take: 5,
      orderBy: { expectedCloseDate: 'asc' },
      include: {
        contact: { select: { name: true } },
      },
    }) ?? [];

    // Sales funnel data
    const funnelData = await prisma?.list?.findMany?.({
      where: {
        board: { type: 'contacts' },
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { order: 'asc' },
    }) ?? [];

    return NextResponse.json({
      totalContacts,
      openDeals,
      totalValue,
      pendingTasks,
      upcomingTasks: (upcomingTasks ?? []).map((task) => ({
        id: task?.id ?? '',
        title: task?.title ?? '',
        dueDate: task?.dueDate ?? null,
        listTitle: task?.list?.title ?? '',
      })),
      recentActivities: (recentActivities ?? []).map((activity) => ({
        id: activity?.id ?? '',
        type: activity?.type ?? '',
        title: activity?.title ?? '',
        createdAt: activity?.createdAt ?? new Date(),
        contactName: activity?.contact?.name ?? null,
        dealTitle: activity?.deal?.title ?? null,
      })),
      closingDeals: (closingDeals ?? []).map((deal) => ({
        id: deal?.id ?? '',
        title: deal?.title ?? '',
        value: deal?.value ?? 0,
        expectedCloseDate: deal?.expectedCloseDate ?? new Date(),
        contactName: deal?.contact?.name ?? null,
      })),
      funnelData: (funnelData ?? []).map((list) => ({
        title: list?.title ?? '',
        count: list?._count?.cards ?? 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
