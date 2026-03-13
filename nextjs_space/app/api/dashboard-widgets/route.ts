import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_WIDGETS = [
  { widgetKey: 'totalContacts', title: 'Total de Contatos', order: 0, column: 0 },
  { widgetKey: 'openDeals', title: 'Negócios Abertos', order: 1, column: 1 },
  { widgetKey: 'totalValue', title: 'Valor Total', order: 2, column: 2 },
  { widgetKey: 'pendingTasks', title: 'Tarefas Pendentes', order: 3, column: 3 },
  { widgetKey: 'salesFunnel', title: 'Funil de Vendas', order: 4, column: 0 },
  { widgetKey: 'upcomingTasks', title: 'Próximas Tarefas', order: 5, column: 1 },
  { widgetKey: 'closingDeals', title: 'Negócios Fechando', order: 6, column: 2 },
  { widgetKey: 'recentActivities', title: 'Atividades Recentes', order: 7, column: 3 },
];

// GET all dashboard widgets
export async function GET() {
  try {
    let widgets = await prisma.dashboardWidget.findMany({
      orderBy: { order: 'asc' },
    });

    // If no widgets exist, create defaults
    if (widgets.length === 0) {
      await prisma.dashboardWidget.createMany({
        data: DEFAULT_WIDGETS,
      });
      widgets = await prisma.dashboardWidget.findMany({
        orderBy: { order: 'asc' },
      });
    }

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard widgets' }, { status: 500 });
  }
}

// POST update widget positions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgets } = body;

    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json({ error: 'Widgets array is required' }, { status: 400 });
    }

    // Update all widgets in parallel
    await Promise.all(
      widgets.map((widget: { id: string; order: number; column: number }) =>
        prisma.dashboardWidget.update({
          where: { id: widget.id },
          data: { order: widget.order, column: widget.column },
        })
      )
    );

    const updatedWidgets = await prisma.dashboardWidget.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(updatedWidgets);
  } catch (error) {
    console.error('Error updating dashboard widgets:', error);
    return NextResponse.json({ error: 'Failed to update dashboard widgets' }, { status: 500 });
  }
}
