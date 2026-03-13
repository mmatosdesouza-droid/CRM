import KanbanBoard from '@/components/kanban/kanban-board';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TasksKanbanPage() {
  // Get the tasks board
  const board = await prisma?.board?.findFirst?.({
    where: { type: 'tasks' },
  });

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Quadro de tarefas não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <KanbanBoard boardId={board?.id ?? ''} boardType="tasks" />
    </div>
  );
}
