'use client';

import { useEffect, useState } from 'react';
import { Phone, Mail, Calendar as CalendarIcon, CheckSquare, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const activityIcons: any = {
  call: Phone,
  email: Mail,
  meeting: CalendarIcon,
  task: CheckSquare,
  note: FileText,
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res?.json?.();
      setActivities(data ?? []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Atividades</h1>
        <p className="text-muted-foreground mt-1">Timeline de todas as suas atividades</p>
      </div>

      <div className="space-y-3">
        {(activities ?? []).map((activity) => {
          const Icon = activityIcons[activity?.type ?? 'note'] ?? FileText;
          
          return (
            <Card key={activity?.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{activity?.title ?? ''}</h3>
                        {activity?.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{activity?.type ?? ''}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {activity?.contact && (
                        <span>Contato: {activity.contact.name}</span>
                      )}
                      {activity?.deal && (
                        <span>Negócio: {activity.deal.title}</span>
                      )}
                      {activity?.scheduledAt && (
                        <span>Agendado: {format(new Date(activity.scheduledAt), 'dd MMM yyyy, HH:mm', { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
