'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, CheckSquare, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageSquare, X, Image, Video, FileText, Paperclip } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addYears, subYears, setMonth, setYear, getYear, getMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface ScheduledMessageEvent {
  id: string;
  title: string;
  date: Date;
  type: 'scheduled_message';
  message: string;
  cardTitle: string;
  contactName?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDayMessages, setSelectedDayMessages] = useState<ScheduledMessageEvent[]>([]);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [selectedPopupDate, setSelectedPopupDate] = useState<Date | null>(null);

  // Gerar lista de anos (10 anos atrás até 10 anos à frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch tasks with due dates
      const tasksRes = await fetch('/api/boards');
      const boards = await tasksRes?.json?.();
      const tasksBoard = (boards ?? []).find((b: any) => b?.type === 'tasks');
      const contactsBoard = (boards ?? []).find((b: any) => b?.type === 'contacts');
      
      const tasks = (tasksBoard?.lists ?? []).flatMap((l: any) => 
        (l?.cards ?? []).filter((c: any) => c?.dueDate).map((c: any) => ({
          id: c.id,
          title: c.title,
          date: new Date(c.dueDate),
          type: 'task',
          description: c.description,
          listName: l.title,
        }))
      );

      const contactTasks = (contactsBoard?.lists ?? []).flatMap((l: any) => 
        (l?.cards ?? []).filter((c: any) => c?.dueDate).map((c: any) => ({
          id: c.id,
          title: c.title,
          date: new Date(c.dueDate),
          type: 'contact',
          description: c.description,
          listName: l.title,
        }))
      );

      // Fetch deals with expected close dates
      const dealsRes = await fetch('/api/deals');
      const deals = await dealsRes?.json?.();
      const dealEvents = (deals ?? []).filter((d: any) => d?.expectedCloseDate).map((d: any) => ({
        id: d.id,
        title: d.title,
        date: new Date(d.expectedCloseDate),
        type: 'deal',
        value: d.value,
        status: d.status,
        contactName: d.contact?.name,
      }));

      // Fetch activities
      const activitiesRes = await fetch('/api/activities');
      const activities = await activitiesRes?.json?.();
      const activityEvents = (activities ?? []).filter((a: any) => a?.scheduledAt).map((a: any) => ({
        id: a.id,
        title: a.title,
        date: new Date(a.scheduledAt),
        type: 'activity',
        activityType: a.type,
        description: a.description,
      }));

      // Fetch scheduled messages
      const messagesRes = await fetch('/api/scheduled-messages');
      const messages = await messagesRes?.json?.();
      const messageEvents: ScheduledMessageEvent[] = (messages ?? []).map((m: any) => ({
        id: m.id,
        title: 'Mensagem Agendada',
        date: new Date(m.scheduledAt),
        type: 'scheduled_message' as const,
        message: m.message,
        cardTitle: m.card?.title ?? '',
        contactName: m.card?.contact?.name,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        mediaName: m.mediaName,
      }));

      setEvents([...tasks, ...contactTasks, ...dealEvents, ...activityEvents]);
      setScheduledMessages(messageEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Obter o dia da semana do primeiro dia do mês (0 = Domingo)
  const firstDayOfWeek = monthStart.getDay();

  const getEventsForDay = (day: Date) => {
    return (events ?? []).filter((event) => {
      const eventDate = new Date(event?.date ?? new Date());
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };

  const getMessagesForDay = (day: Date) => {
    return scheduledMessages.filter((msg) => isSameDay(new Date(msg.date), day));
  };

  const hasMessagesOnDay = (day: Date) => {
    return getMessagesForDay(day).length > 0;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-500/20 text-blue-700 border-blue-500';
      case 'contact':
        return 'bg-purple-500/20 text-purple-700 border-purple-500';
      case 'deal':
        return 'bg-green-500/20 text-green-700 border-green-500';
      case 'activity':
        return 'bg-orange-500/20 text-orange-700 border-orange-500';
      case 'scheduled_message':
        return 'bg-pink-500/20 text-pink-700 border-pink-500';
      default:
        return 'bg-primary/10 text-primary border-primary';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task':
      case 'contact':
        return <CheckSquare className="h-3 w-3 flex-shrink-0" />;
      case 'deal':
        return <Briefcase className="h-3 w-3 flex-shrink-0" />;
      case 'activity':
        return <CalendarIcon className="h-3 w-3 flex-shrink-0" />;
      case 'scheduled_message':
        return <MessageSquare className="h-3 w-3 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex !== -1) {
      setCurrentDate(setMonth(currentDate, monthIndex));
    }
  };

  const handleYearChange = (year: string) => {
    setCurrentDate(setYear(currentDate, parseInt(year)));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    const dayMessages = getMessagesForDay(day);
    if (dayMessages.length > 0) {
      setSelectedDayMessages(dayMessages);
      setSelectedPopupDate(day);
      setShowMessagesPopup(true);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho com navegação completa */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as suas tarefas, negócios, atividades e mensagens agendadas
          </p>
        </div>

        {/* Controles de navegação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de navegação rápida */}
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subYears(currentDate, 1))} title="Ano anterior">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))} title="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="px-3">
              Hoje
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))} title="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addYears(currentDate, 1))} title="Próximo ano">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Seletores de mês e ano */}
          <div className="flex items-center gap-2">
            <Select value={MONTHS[getMonth(currentDate)]} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={getYear(currentDate).toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Título do mês atual */}
      <div className="text-center">
        <h2 className="text-2xl font-bold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/50"></div>
          <span>Tarefas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/50"></div>
          <span>Contatos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/50"></div>
          <span>Negócios</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500/50"></div>
          <span>Atividades</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-pink-500/50"></div>
          <span>Mensagens Agendadas</span>
        </div>
      </div>

      {/* Grade do calendário */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-muted">
          {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm p-3 border-b">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7">
          {/* Espaços vazios para alinhar o primeiro dia */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] bg-muted/30 border-b border-r" />
          ))}

          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const dayMessages = getMessagesForDay(day);
            const allDayItems = [...dayEvents, ...dayMessages];
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const hasMessages = dayMessages.length > 0;
            
            return (
              <div
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] border-b border-r p-1 transition-colors cursor-pointer ${
                  !isCurrentMonth ? 'bg-muted/30' : 'hover:bg-muted/20'
                } ${isCurrentDay ? 'bg-primary/5' : ''} ${
                  hasMessages ? 'ring-2 ring-inset ring-pink-400/50' : ''
                }`}
              >
                <div className="flex items-center justify-between p-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isCurrentDay 
                      ? 'bg-primary text-primary-foreground' 
                      : ''
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasMessages && (
                      <Badge variant="secondary" className="bg-pink-500/20 text-pink-700 text-xs px-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="ml-1">{dayMessages.length}</span>
                      </Badge>
                    )}
                    {allDayItems.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{allDayItems.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 mt-1">
                  {/* Mostrar mensagens agendadas primeiro */}
                  {dayMessages.slice(0, 1).map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs p-1 rounded border-l-2 cursor-pointer transition-all hover:shadow-sm ${getEventColor('scheduled_message')}`}
                      title={msg.message}
                    >
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate flex-1">{msg.cardTitle || 'Mensagem'}</span>
                      </div>
                    </div>
                  ))}
                  {/* Mostrar outros eventos */}
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event?.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className={`text-xs p-1 rounded border-l-2 cursor-pointer transition-all hover:shadow-sm ${getEventColor(event?.type)}`}
                      title={event?.title}
                    >
                      <div className="flex items-center gap-1">
                        {getEventIcon(event?.type)}
                        <span className="truncate flex-1">{event?.title ?? ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Preencher o restante da última semana */}
          {Array.from({ length: (7 - ((firstDayOfWeek + daysInMonth.length) % 7)) % 7 }).map((_, i) => (
            <div key={`end-empty-${i}`} className="min-h-[120px] bg-muted/30 border-b border-r" />
          ))}
        </div>
      </div>

      {/* Popup de Mensagens Agendadas */}
      {showMessagesPopup && selectedPopupDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMessagesPopup(false)}>
          <Card className="w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-pink-500" />
                  Mensagens Agendadas
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(selectedPopupDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMessagesPopup(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedDayMessages.map((msg) => (
                <div key={msg.id} className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-pink-700 dark:text-pink-300">
                        {msg.cardTitle || 'Cartão'}
                      </p>
                      {msg.contactName && (
                        <p className="text-sm text-muted-foreground">Contato: {msg.contactName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.mediaType && (
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {msg.mediaType === 'image' || msg.mediaType === 'gif' ? (
                            <Image className="h-3 w-3 mr-1" />
                          ) : msg.mediaType === 'video' ? (
                            <Video className="h-3 w-3 mr-1" />
                          ) : (
                            <Paperclip className="h-3 w-3 mr-1" />
                          )}
                          {msg.mediaType === 'gif' ? 'GIF' : msg.mediaType === 'image' ? 'Imagem' : msg.mediaType === 'video' ? 'Vídeo' : 'Arquivo'}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Agendada
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Mídia anexada */}
                  {msg.mediaUrl && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 mt-2">
                      {(msg.mediaType === 'image' || msg.mediaType === 'gif') ? (
                        <img 
                          src={msg.mediaUrl} 
                          alt={msg.mediaName || 'Mídia'} 
                          className="max-h-48 mx-auto rounded object-contain"
                        />
                      ) : msg.mediaType === 'video' ? (
                        <video 
                          src={msg.mediaUrl} 
                          className="max-h-48 mx-auto rounded" 
                          controls
                        />
                      ) : (
                        <a 
                          href={msg.mediaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FileText className="h-5 w-5" />
                          <span>{msg.mediaName || 'Arquivo anexado'}</span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Mensagem de texto */}
                  {msg.message && (
                    <div className="bg-white dark:bg-gray-800 rounded p-3 mt-2">
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <Card className="w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {getEventIcon(selectedEvent.type)}
                <CardTitle>{selectedEvent.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(new Date(selectedEvent.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">
                  {selectedEvent.type === 'task' ? 'Tarefa' :
                   selectedEvent.type === 'contact' ? 'Contato' :
                   selectedEvent.type === 'deal' ? 'Negócio' :
                   selectedEvent.type === 'activity' ? 'Atividade' : selectedEvent.type}
                </p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.value && (
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-green-600">
                    R$ {selectedEvent.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {selectedEvent.status && (
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedEvent.status}</p>
                </div>
              )}

              {selectedEvent.listName && (
                <div>
                  <p className="text-sm text-muted-foreground">Lista</p>
                  <p className="font-medium">{selectedEvent.listName}</p>
                </div>
              )}

              {selectedEvent.contactName && (
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium">{selectedEvent.contactName}</p>
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => setSelectedEvent(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
