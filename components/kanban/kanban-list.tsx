'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import KanbanCard from './kanban-card';
import CardDetailsModal from './card-details-modal';

interface KanbanListProps {
  list: any;
  onUpdateTitle: (listId: string, title: string) => void;
  onDelete: (listId: string) => void;
  onCreateCard: (listId: string, title: string) => void;
  boardType: 'contacts' | 'tasks';
  onCardUpdate?: () => void;
}

export default function KanbanList({ list, onUpdateTitle, onDelete, onCreateCard, boardType, onCardUpdate }: KanbanListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list?.title ?? '');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const { setNodeRef } = useDroppable({ id: list?.id ?? '' });

  const handleSaveTitle = () => {
    if (title?.trim?.() && title !== list?.title) {
      onUpdateTitle?.(list?.id ?? '', title ?? '');
    }
    setIsEditing(false);
  };

  const handleCreateCard = () => {
    if (!newCardTitle?.trim?.()) return;
    onCreateCard?.(list?.id ?? '', newCardTitle ?? '');
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  return (
    <>
      <Card ref={setNodeRef} className="flex-shrink-0 w-80 flex flex-col max-h-[calc(100vh-200px)]">
        <div className="p-3 border-b flex items-center justify-between">
          {isEditing ? (
            <Input
              value={title ?? ''}
              onChange={(e) => setTitle(e?.target?.value ?? '')}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e?.key === 'Enter' && handleSaveTitle()}
              className="h-8 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold flex-1">
              {list?.title ?? ''}
              <span className="ml-2 text-muted-foreground">({list?.cards?.length ?? 0})</span>
            </h3>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(list?.id ?? '')} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <SortableContext items={(list?.cards ?? []).map((c: any) => c?.id ?? '')} strategy={verticalListSortingStrategy}>
            {(list?.cards ?? []).map((card: any) => (
              <div key={card?.id} onClick={() => setSelectedCard(card)}>
                <KanbanCard card={card} />
              </div>
            ))}
          </SortableContext>
        </div>

        <div className="p-3 border-t">
          {isAddingCard ? (
            <div className="space-y-2">
              <Input
                value={newCardTitle ?? ''}
                onChange={(e) => setNewCardTitle(e?.target?.value ?? '')}
                placeholder="Título do cartão..."
                autoFocus
                onKeyDown={(e) => e?.key === 'Enter' && handleCreateCard()}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateCard} size="sm" className="h-8">
                  Adicionar
                </Button>
                <Button onClick={() => { setIsAddingCard(false); setNewCardTitle(''); }} variant="ghost" size="sm" className="h-8">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAddingCard(true)}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar cartão
            </Button>
          )}
        </div>
      </Card>

      {selectedCard && (
        <CardDetailsModal
          cardId={selectedCard?.id ?? ''}
          isOpen={!!selectedCard}
          onClose={() => {
            setSelectedCard(null);
            onCardUpdate?.();
          }}
          boardType={boardType}
          onCardUpdate={onCardUpdate}
        />
      )}
    </>
  );
}
