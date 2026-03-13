'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import KanbanList from './kanban-list';
import KanbanCard from './kanban-card';

interface KanbanBoardProps {
  boardId: string;
  boardType: 'contacts' | 'tasks';
}

export default function KanbanBoard({ boardId, boardType }: KanbanBoardProps) {
  const [board, setBoard] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/boards/${boardId}`);
      const data = await res?.json?.();
      setBoard(data ?? null);
      setLists(data?.lists ?? []);
    } catch (error) {
      console.error('Error fetching board:', error);
      toast.error('Erro ao carregar quadro');
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListTitle?.trim?.()) return;

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle, boardId }),
      });

      const newList = await res?.json?.();
      setLists([...(lists ?? []), { ...newList, cards: [] }]);
      setNewListTitle('');
      setIsAddingList(false);
      toast.success('Lista criada com sucesso');
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Erro ao criar lista');
    }
  };

  const updateListTitle = async (listId: string, title: string) => {
    try {
      await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      setLists((lists ?? []).map((l) => (l?.id === listId ? { ...l, title } : l)));
      toast.success('Lista renomeada');
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Erro ao renomear lista');
    }
  };

  const deleteList = async (listId: string) => {
    try {
      await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
      setLists((lists ?? []).filter((l) => l?.id !== listId));
      toast.success('Lista removida');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Erro ao remover lista');
    }
  };

  const createCard = async (listId: string, title: string) => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, listId }),
      });

      const newCard = await res?.json?.();
      setLists((lists ?? []).map((l) => 
        l?.id === listId ? { ...l, cards: [...(l?.cards ?? []), newCard] } : l
      ));
      toast.success('Cartão criado');
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Erro ao criar cartão');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event ?? {};
    const activeList = (lists ?? []).find((l) => (l?.cards ?? []).some((c: any) => c?.id === active?.id));
    const card = (activeList?.cards ?? []).find((c: any) => c?.id === active?.id);
    setActiveCard(card ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event ?? {};
    if (!over) return;

    const activeId = active?.id;
    const overId = over?.id;

    if (activeId === overId) return;

    const activeList = (lists ?? []).find((l) => (l?.cards ?? []).some((c: any) => c?.id === activeId));
    const overList = (lists ?? []).find((l) => l?.id === overId || (l?.cards ?? []).some((c: any) => c?.id === overId));

    if (!activeList || !overList) return;

    if (activeList?.id !== overList?.id) {
      setLists((lists ?? []).map((list) => {
        if (list?.id === activeList?.id) {
          return {
            ...list,
            cards: (list?.cards ?? []).filter((c: any) => c?.id !== activeId),
          };
        }
        if (list?.id === overList?.id) {
          const overIndex = (list?.cards ?? []).findIndex((c: any) => c?.id === overId);
          const activeCard = (activeList?.cards ?? []).find((c: any) => c?.id === activeId);
          const newCards = [...(list?.cards ?? [])];
          if (overIndex >= 0) {
            newCards.splice(overIndex, 0, activeCard);
          } else {
            newCards.push(activeCard);
          }
          return { ...list, cards: newCards };
        }
        return list;
      }));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event ?? {};
    setActiveCard(null);

    if (!over) return;

    const activeId = active?.id;
    const overId = over?.id;

    const activeList = (lists ?? []).find((l) => (l?.cards ?? []).some((c: any) => c?.id === activeId));
    const overList = (lists ?? []).find((l) => l?.id === overId || (l?.cards ?? []).some((c: any) => c?.id === overId));

    if (!activeList || !overList) return;

    const targetListId = overList?.id;
    const cards = overList?.cards ?? [];
    const targetOrder = cards?.findIndex?.((c: any) => c?.id === activeId) ?? 0;

    try {
      await fetch('/api/cards/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: activeId,
          targetListId,
          targetOrder,
        }),
      });
    } catch (error) {
      console.error('Error moving card:', error);
      toast.error('Erro ao mover cartão');
      fetchBoard(); // Reload to fix state
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{board?.title ?? ''}</h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={(lists ?? []).map((l) => l?.id ?? '')} strategy={horizontalListSortingStrategy}>
            {(lists ?? []).map((list) => (
              <KanbanList
                key={list?.id}
                list={list}
                onUpdateTitle={updateListTitle}
                onDelete={deleteList}
                onCreateCard={createCard}
                boardType={boardType}
                onCardUpdate={fetchBoard}
              />
            ))}
          </SortableContext>

          <div className="flex-shrink-0 w-80">
            {isAddingList ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Input
                  value={newListTitle ?? ''}
                  onChange={(e) => setNewListTitle(e?.target?.value ?? '')}
                  placeholder="Nome da lista..."
                  autoFocus
                  onKeyDown={(e) => e?.key === 'Enter' && createList()}
                />
                <div className="flex gap-2">
                  <Button onClick={createList} size="sm">
                    Adicionar
                  </Button>
                  <Button onClick={() => { setIsAddingList(false); setNewListTitle(''); }} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingList(true)}
                variant="ghost"
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar lista
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
