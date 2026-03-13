// Type definitions for the CRM Kanban application

export type BoardType = 'contacts' | 'tasks';

export type DealStatus = 'lead' | 'in_progress' | 'won' | 'lost';

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

export interface CardWithDetails {
  id: string;
  title: string;
  description?: string;
  order: number;
  dueDate?: Date;
  coverImageUrl?: string;
  labels: Array<{ id: string; name: string; color: string }>;
  checklists: Array<{
    id: string;
    title: string;
    items: Array<{ id: string; text: string; completed: boolean }>;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    url?: string;
    cloudStoragePath?: string;
    isPublic: boolean;
    fileType?: string;
  }>;
  contact?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  deal?: {
    id: string;
    title: string;
    value: number;
  };
}

export interface DashboardMetrics {
  totalContacts: number;
  openDeals: number;
  totalValue: number;
  pendingTasks: number;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: Date;
    listTitle: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: Date;
    contactName?: string;
    dealTitle?: string;
  }>;
  closingDeals: Array<{
    id: string;
    title: string;
    value: number;
    expectedCloseDate: Date;
    contactName?: string;
  }>;
}
