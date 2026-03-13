'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, Paperclip, User, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  card: any;
  isDragging?: boolean;
}

export default function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card?.id ?? '' });

  const style = {
    transform: CSS.Transform.toString(transform ?? null),
    transition: transition ?? undefined,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // Calculate checklist progress
  const totalItems = (card?.checklists ?? []).reduce((sum: number, cl: any) => sum + (cl?.items?.length ?? 0), 0);
  const completedItems = (card?.checklists ?? []).reduce(
    (sum: number, cl: any) => sum + (cl?.items ?? []).filter((i: any) => i?.completed)?.length ?? 0,
    0
  );
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Due date status
  const getDueDateColor = () => {
    if (!card?.dueDate) return '';
    const dueDate = new Date(card.dueDate);
    if (isPast(dueDate) && !isToday(dueDate)) return 'bg-red-500 text-white';
    if (isToday(dueDate) || isTomorrow(dueDate)) return 'bg-yellow-500 text-white';
    return 'bg-muted';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      {card?.coverImageUrl && (
        <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
          <img
            src={card.coverImageUrl}
            alt="Card cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-3 space-y-2">
        <div className="space-y-1">
          {(card?.labels ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(card?.labels ?? []).slice(0, 3)?.map?.((label: any) => (
                <div
                  key={label?.id}
                  className="h-2 w-10 rounded-full"
                  style={{ backgroundColor: label?.color ?? '#000' }}
                  title={label?.name ?? ''}
                />
              ))}
            </div>
          )}

          <h4 className="text-sm font-medium line-clamp-2">{card?.title ?? ''}</h4>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {card?.dueDate && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${getDueDateColor()}`}>
              <Clock className="h-3 w-3" />
              <span>{format(new Date(card.dueDate), 'dd MMM', { locale: ptBR })}</span>
            </div>
          )}

          {totalItems > 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              checklistProgress === 100 ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              <CheckSquare className="h-3 w-3" />
              <span>{completedItems}/{totalItems}</span>
            </div>
          )}

          {(card?.attachments ?? []).length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
              <Paperclip className="h-3 w-3" />
              <span>{card?.attachments?.length ?? 0}</span>
            </div>
          )}

          {card?.contact && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{card?.contact?.name ?? ''}</span>
            </div>
          )}

          {card?.deal && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
              <DollarSign className="h-3 w-3" />
              <span>R$ {(card?.deal?.value ?? 0).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
