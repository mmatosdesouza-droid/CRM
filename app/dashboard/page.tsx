'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, DollarSign, CheckSquare, Calendar, Activity, GripVertical, Settings, Eye, EyeOff } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface DashboardWidget {
  id: string;
  widgetKey: string;
  title: string;
  order: number;
  column: number;
  visible: boolean;
}

interface DashboardMetrics {
  totalContacts: number;
  openDeals: number;
  totalValue: number;
  pendingTasks: number;
  upcomingTasks: any[];
  recentActivities: any[];
  dealsClosingSoon: any[];
  funnelData: any[];
}

const CHART_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

// Componente de Widget Arrastrável
function SortableWidget({ widget, children, isEditMode }: { widget: DashboardWidget; children: React.ReactNode; isEditMode: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full p-1 cursor-grab active:cursor-grabbing shadow-lg"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeWidget, setActiveWidget] = useState<DashboardWidget | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res?.json?.();
      setMetrics(data ?? null);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  const fetchWidgets = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-widgets');
      const data = await res?.json?.();
      setWidgets(data ?? []);
    } catch (error) {
      console.error('Error fetching widgets:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchWidgets();
  }, [fetchDashboard, fetchWidgets]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const widget = widgets.find((w) => w.id === active.id);
    setActiveWidget(widget ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWidget(null);

    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    const newWidgets = arrayMove(widgets, oldIndex, newIndex).map((w, index) => ({
      ...w,
      order: index,
    }));

    setWidgets(newWidgets);

    // Salvar no banco de dados
    try {
      await fetch('/api/dashboard-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: newWidgets.map((w) => ({ id: w.id, order: w.order, column: w.column })),
        }),
      });
      toast.success('Layout salvo');
    } catch (error) {
      console.error('Error saving widget order:', error);
      toast.error('Erro ao salvar layout');
    }
  };

  const toggleWidgetVisibility = async (widgetId: string) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    setWidgets(newWidgets);
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    if (!metrics) return null;

    switch (widget.widgetKey) {
      case 'totalContacts':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalContacts}</div>
              <p className="text-xs text-muted-foreground">contatos cadastrados</p>
            </CardContent>
          </Card>
        );

      case 'openDeals':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negócios Abertos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openDeals}</div>
              <p className="text-xs text-muted-foreground">em negociação</p>
            </CardContent>
          </Card>
        );

      case 'totalValue':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.totalValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">em negociação</p>
            </CardContent>
          </Card>
        );

      case 'pendingTasks':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">a concluir</p>
            </CardContent>
          </Card>
        );

      case 'salesFunnel':
        return (
          <Card className={`col-span-2 ${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Funil de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(metrics.funnelData ?? []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics.funnelData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} cartões`, 'Quantidade']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {(metrics.funnelData ?? []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado no funil ainda
                </p>
              )}
            </CardContent>
          </Card>
        );

      case 'upcomingTasks':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(metrics.upcomingTasks ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(metrics.upcomingTasks ?? []).slice(0, 5).map((task: any) => (
                    <div key={task?.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{task?.title ?? ''}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {task?.dueDate ? format(new Date(task.dueDate), 'dd/MM', { locale: ptBR }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa próxima</p>
              )}
            </CardContent>
          </Card>
        );

      case 'closingDeals':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" />
                Negócios Fechando
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(metrics.dealsClosingSoon ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(metrics.dealsClosingSoon ?? []).slice(0, 5).map((deal: any) => (
                    <div key={deal?.id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{deal?.title ?? ''}</span>
                      <span className="text-green-600 font-medium ml-2">
                        R$ {(deal?.value ?? 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum negócio próximo</p>
              )}
            </CardContent>
          </Card>
        );

      case 'recentActivities':
        return (
          <Card className={`${isEditMode ? 'ring-2 ring-dashed ring-primary/30' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(metrics.recentActivities ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(metrics.recentActivities ?? []).slice(0, 5).map((activity: any) => (
                    <div key={activity?.id} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                      <span className="truncate flex-1">{activity?.title ?? ''}</span>
                      <span className="text-muted-foreground text-xs">
                        {activity?.createdAt ? format(new Date(activity.createdAt), 'dd/MM', { locale: ptBR }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu CRM</p>
        </div>
        <Button
          variant={isEditMode ? 'default' : 'outline'}
          onClick={() => setIsEditMode(!isEditMode)}
          className="flex items-center gap-2"
        >
          <Settings className={`h-4 w-4 ${isEditMode ? 'animate-spin' : ''}`} />
          {isEditMode ? 'Concluir Edição' : 'Editar Layout'}
        </Button>
      </div>

      {isEditMode && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <p className="text-sm text-center">
              <GripVertical className="h-4 w-4 inline mr-1" />
              Arraste os widgets para reorganizar o dashboard. As alterações são salvas automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {visibleWidgets.map((widget) => (
              <SortableWidget key={widget.id} widget={widget} isEditMode={isEditMode}>
                <div className={widget.widgetKey === 'salesFunnel' ? 'col-span-2' : ''}>
                  {renderWidgetContent(widget)}
                </div>
              </SortableWidget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className="opacity-80 scale-105">
              {renderWidgetContent(activeWidget)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gerenciar Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`flex items-center justify-between p-2 rounded border ${
                    widget.visible ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'
                  }`}
                >
                  <span className="text-sm">{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                  >
                    {widget.visible ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
