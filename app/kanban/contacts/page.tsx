import KanbanBoard from '@/components/kanban/kanban-board';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ContactsKanbanPage() {
  // Get the contacts board
  const board = await prisma?.board?.findFirst?.({
    where: { type: 'contacts' },
  });

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Quadro de contatos não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <KanbanBoard boardId={board?.id ?? ''} boardType="contacts" />
    </div>
  );
}
