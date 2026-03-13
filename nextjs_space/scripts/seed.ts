import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default labels
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'Urgente', color: '#FF6363' } }),
    prisma.label.create({ data: { name: 'Importante', color: '#FF9149' } }),
    prisma.label.create({ data: { name: 'Em Andamento', color: '#60B5FF' } }),
    prisma.label.create({ data: { name: 'Concluído', color: '#72BF78' } }),
    prisma.label.create({ data: { name: 'Aguardando', color: '#A19AD3' } }),
    prisma.label.create({ data: { name: 'Cliente VIP', color: '#FF90BB' } }),
  ]);
  console.log('✅ Created', labels.length, 'labels');

  // Create Contacts Board
  const contactsBoard = await prisma.board.create({
    data: {
      title: 'Pipeline de Vendas',
      type: 'contacts',
      lists: {
        create: [
          { title: 'Novos', order: 0 },
          { title: 'Proposta Enviada', order: 1 },
          { title: 'Negócios Fechados', order: 2 },
          { title: 'Negócios Não Fechados', order: 3 },
        ],
      },
    },
    include: { lists: true },
  });
  console.log('✅ Created Contacts Board with', contactsBoard.lists.length, 'lists');

  // Create Tasks Board
  const tasksBoard = await prisma.board.create({
    data: {
      title: 'Gerenciamento de Tarefas',
      type: 'tasks',
      lists: {
        create: [
          { title: 'A Fazer', order: 0 },
          { title: 'Em Andamento', order: 1 },
          { title: 'Pendentes', order: 2 },
          { title: 'Concluídas', order: 3 },
        ],
      },
    },
    include: { lists: true },
  });
  console.log('✅ Created Tasks Board with', tasksBoard.lists.length, 'lists');

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 98765-4321',
        company: 'Tech Solutions Ltda',
        notes: 'Interessado em nossos serviços de consultoria',
        labels: { connect: [{ id: labels[5].id }] },
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '(21) 99876-5432',
        company: 'Design Studio',
        notes: 'Contato inicial via WhatsApp',
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        phone: '(31) 98123-4567',
        company: 'Marketing Plus',
        notes: 'Cliente em potencial - muito interessado',
        labels: { connect: [{ id: labels[1].id }] },
      },
    }),
  ]);
  console.log('✅ Created', contacts.length, 'contacts');

  // Create sample deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Projeto de Consultoria',
        value: 15000,
        status: 'in_progress',
        expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        description: 'Consultoria em transformação digital',
        contactId: contacts[0].id,
        labels: { connect: [{ id: labels[2].id }] },
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Redesign de Site',
        value: 8000,
        status: 'lead',
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        description: 'Redesign completo do site institucional',
        contactId: contacts[1].id,
      },
    }),
  ]);
  console.log('✅ Created', deals.length, 'deals');

  // Create sample activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: 'call',
        title: 'Ligação de acompanhamento',
        description: 'Discutir detalhes do projeto',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        contactId: contacts[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'meeting',
        title: 'Reunião de apresentação',
        description: 'Apresentar proposta detalhada',
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        contactId: contacts[1].id,
        dealId: deals[1].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'email',
        title: 'Envio de proposta',
        description: 'Proposta comercial enviada por e-mail',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        contactId: contacts[2].id,
      },
    }),
  ]);
  console.log('✅ Created', activities.length, 'activities');

  // Create sample cards in Contacts Board
  const contactCards = await Promise.all([
    prisma.card.create({
      data: {
        title: contacts[0].name,
        description: `${contacts[0].company} - ${contacts[0].notes}`,
        listId: contactsBoard.lists[1].id, // Proposta Enviada
        order: 0,
        contactId: contacts[0].id,
        dealId: deals[0].id,
        labels: { connect: [{ id: labels[5].id }, { id: labels[2].id }] },
      },
    }),
    prisma.card.create({
      data: {
        title: contacts[1].name,
        description: `${contacts[1].company} - ${contacts[1].notes}`,
        listId: contactsBoard.lists[0].id, // Novos
        order: 0,
        contactId: contacts[1].id,
        dealId: deals[1].id,
      },
    }),
    prisma.card.create({
      data: {
        title: contacts[2].name,
        description: `${contacts[2].company} - ${contacts[2].notes}`,
        listId: contactsBoard.lists[0].id, // Novos
        order: 1,
        contactId: contacts[2].id,
        labels: { connect: [{ id: labels[1].id }] },
      },
    }),
  ]);
  console.log('✅ Created', contactCards.length, 'cards in Contacts Board');

  // Create sample tasks cards
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const taskCards = await Promise.all([
    prisma.card.create({
      data: {
        title: 'Preparar apresentação para cliente',
        description: 'Criar slides e material de apoio',
        listId: tasksBoard.lists[0].id, // A Fazer
        order: 0,
        dueDate: nextWeek,
        labels: { connect: [{ id: labels[1].id }] },
        checklists: {
          create: [
            {
              title: 'Itens da apresentação',
              order: 0,
              items: {
                create: [
                  { text: 'Criar estrutura dos slides', order: 0, completed: true },
                  { text: 'Adicionar dados e gráficos', order: 1, completed: false },
                  { text: 'Revisar conteúdo', order: 2, completed: false },
                ],
              },
            },
          ],
        },
      },
    }),
    prisma.card.create({
      data: {
        title: 'Enviar proposta comercial',
        description: 'Revisar e enviar proposta para novo cliente',
        listId: tasksBoard.lists[1].id, // Em Andamento
        order: 0,
        dueDate: tomorrow,
        labels: { connect: [{ id: labels[0].id }] },
      },
    }),
    prisma.card.create({
      data: {
        title: 'Atualizar CRM com novos contatos',
        description: 'Adicionar leads da última semana',
        listId: tasksBoard.lists[3].id, // Concluídas
        order: 0,
        labels: { connect: [{ id: labels[3].id }] },
      },
    }),
  ]);
  console.log('✅ Created', taskCards.length, 'cards in Tasks Board');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
