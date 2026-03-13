'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, CheckSquare, MessageSquare, Copy, Trash2, Tag, Calendar, 
  ChevronLeft, ChevronRight, X, Plus, Send, Edit2, Clock, Paperclip,
  Zap, Settings, ChevronDown, Search, ChevronsLeft, ChevronsRight,
  Image, Video, FileText, Upload
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, 
  addMonths, subMonths, isSameDay, addWeeks, addDays, setMonth, setYear,
  getMonth, getYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 8 cores predefinidas para etiquetas
const LABEL_COLORS = [
  { color: '#22c55e', name: 'Verde' },
  { color: '#84cc16', name: 'Lima' },
  { color: '#f97316', name: 'Laranja' },
  { color: '#eab308', name: 'Amarelo' },
  { color: '#ef4444', name: 'Vermelho' },
  { color: '#f472b6', name: 'Rosa' },
  { color: '#8b5cf6', name: 'Roxo' },
  { color: '#06b6d4', name: 'Ciano' },
];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface ScheduledMessageDB {
  id: string;
  message: string;
  scheduledAt: string;
  sent: boolean;
  cardId: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
  cloudStoragePath?: string | null;
  isPublic?: boolean;
}

interface CardDetailsModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  boardType: 'contacts' | 'tasks';
  onScheduleUpdate?: () => void;
  onCardUpdate?: () => void;
}

type ActiveTab = 'power-ups' | 'automations' | 'comments';
type ActivePopover = 'add' | 'labels' | 'dates' | 'checklist' | null;

export default function CardDetailsModal({ cardId, isOpen, onClose, boardType, onScheduleUpdate, onCardUpdate }: CardDetailsModalProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Estados para tabs e popovers
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  
  // Estados para etiquetas
  const [labelSearch, setLabelSearch] = useState('');
  const [newLabelText, setNewLabelText] = useState('');
  const [selectedLabelColor, setSelectedLabelColor] = useState(LABEL_COLORS[0].color);
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  
  // Estados para datas
  const [datesCalendarDate, setDatesCalendarDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startDateEnabled, setStartDateEnabled] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueTime, setDueTime] = useState('12:00');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  // Estados para mini calendário e agendamento de mensagens
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [scheduledMessage, setScheduledMessage] = useState('');
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageDB[]>([]);

  // Estado para nova checklist
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  
  // Estado para popup de mensagens agendadas no mini-calendário
  const [showMiniCalendarMessagesPopup, setShowMiniCalendarMessagesPopup] = useState(false);
  const [miniCalendarPopupDate, setMiniCalendarPopupDate] = useState<Date | null>(null);
  const [miniCalendarPopupMessages, setMiniCalendarPopupMessages] = useState<ScheduledMessageDB[]>([]);
  
  // Estados para mídia em mensagens agendadas
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Estados para edição de mensagens agendadas
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [editingMessageDate, setEditingMessageDate] = useState<Date | null>(null);
  const [editingMediaFile, setEditingMediaFile] = useState<File | null>(null);
  const [editingMediaPreview, setEditingMediaPreview] = useState<string | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [existingMediaType, setExistingMediaType] = useState<string | null>(null);
  const [existingMediaName, setExistingMediaName] = useState<string | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCard();
      fetchAllLabels();
    }
  }, [isOpen, cardId]);

  const fetchAllLabels = async () => {
    try {
      const res = await fetch('/api/labels');
      const data = await res?.json?.();
      setAllLabels(data ?? []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const fetchCard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cards/${cardId}`);
      const data = await res?.json?.();
      setCard(data ?? null);
      setTitle(data?.title ?? '');
      setDescription(data?.description ?? '');
      setScheduledMessages(data?.scheduledMessages ?? []);
      
      // Carregar datas do cartão
      if (data?.dueDate) {
        const due = new Date(data.dueDate);
        setDueDate(due);
        setDueDateEnabled(true);
        setDueTime(format(due, 'HH:mm'));
      }
      if (data?.startDate) {
        setStartDate(new Date(data.startDate));
        setStartDateEnabled(true);
      }
    } catch (error) {
      console.error('Error fetching card:', error);
      toast.error('Erro ao carregar cartão');
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (updates: any) => {
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchCard();
      onCardUpdate?.();
      toast.success('Cartão atualizado');
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Erro ao atualizar cartão');
    }
  };

  const duplicateCard = async () => {
    try {
      await fetch('/api/cards/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      toast.success('Cartão duplicado');
      onClose();
    } catch (error) {
      console.error('Error duplicating card:', error);
      toast.error('Erro ao duplicar cartão');
    }
  };

  const deleteCard = async () => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
    
    try {
      await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      toast.success('Cartão excluído');
      onClose();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Erro ao excluir cartão');
    }
  };

  const createChecklist = async () => {
    if (!newChecklistTitle.trim()) {
      toast.error('Digite um título para a checklist');
      return;
    }

    try {
      await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistTitle, cardId }),
      });
      fetchCard();
      onCardUpdate?.();
      setNewChecklistTitle('');
      setActivePopover(null);
      toast.success('Checklist criada');
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error('Erro ao criar checklist');
    }
  };

  const addChecklistItem = async (checklistId: string) => {
    const text = prompt('Texto do item:');
    if (!text?.trim?.()) return;

    try {
      await fetch(`/api/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      fetchCard();
      onCardUpdate?.();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      await fetch(`/api/checklists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      fetchCard();
      onCardUpdate?.();
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const addComment = async () => {
    const content = prompt('Seu comentário:');
    if (!content?.trim?.()) return;

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, cardId }),
      });
      fetchCard();
      onCardUpdate?.();
      toast.success('Comentário adicionado');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  // Funções para etiquetas
  const createLabel = async () => {
    if (!newLabelText.trim()) {
      toast.error('Digite um texto para a etiqueta');
      return;
    }

    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelText, color: selectedLabelColor }),
      });
      const newLabel = await res?.json?.();
      
      const currentLabelIds = (card?.labels ?? []).map((l: any) => l.id);
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelIds: [...currentLabelIds, newLabel.id] }),
      });
      
      setNewLabelText('');
      setShowCreateLabel(false);
      await fetchAllLabels();
      await fetchCard();
      toast.success('Etiqueta criada e adicionada');
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Erro ao criar etiqueta');
    }
  };

  const updateLabel = async (labelId: string, name: string, color: string) => {
    try {
      await fetch(`/api/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      await fetchAllLabels();
      await fetchCard();
      setEditingLabelId(null);
      toast.success('Etiqueta atualizada');
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error('Erro ao atualizar etiqueta');
    }
  };

  const toggleLabelOnCard = async (labelId: string) => {
    const currentLabelIds = (card?.labels ?? []).map((l: any) => l.id);
    const hasLabel = currentLabelIds.includes(labelId);
    
    const newLabelIds = hasLabel
      ? currentLabelIds.filter((id: string) => id !== labelId)
      : [...currentLabelIds, labelId];

    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelIds: newLabelIds }),
      });
      await fetchCard();
    } catch (error) {
      console.error('Error toggling label:', error);
      toast.error('Erro ao atualizar etiqueta');
    }
  };

  // Funções para datas
  const getDatesCalendarDays = () => {
    const monthStart = startOfMonth(datesCalendarDate);
    const monthEnd = endOfMonth(datesCalendarDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const saveDates = async () => {
    const updates: any = {};
    
    if (dueDateEnabled && dueDate) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      const fullDueDate = new Date(dueDate);
      fullDueDate.setHours(hours, minutes, 0, 0);
      updates.dueDate = fullDueDate.toISOString();
    } else {
      updates.dueDate = null;
    }
    
    if (startDateEnabled && startDate) {
      updates.startDate = startDate.toISOString();
    } else {
      updates.startDate = null;
    }
    
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchCard();
      onCardUpdate?.();
      setActivePopover(null);
      toast.success('Datas salvas');
    } catch (error) {
      console.error('Error saving dates:', error);
      toast.error('Erro ao salvar datas');
    }
  };

  const removeDates = async () => {
    setStartDate(null);
    setStartDateEnabled(false);
    setDueDate(null);
    setDueDateEnabled(false);
    setDueTime('12:00');
    
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: null, startDate: null }),
      });
      fetchCard();
      onCardUpdate?.();
      setActivePopover(null);
      toast.success('Datas removidas');
    } catch (error) {
      console.error('Error removing dates:', error);
      toast.error('Erro ao remover datas');
    }
  };

  const handleDateClick = (day: Date) => {
    if (!startDateEnabled && !dueDateEnabled) {
      setDueDate(day);
      setDueDateEnabled(true);
    } else if (dueDateEnabled && !startDateEnabled) {
      setDueDate(day);
    } else if (startDateEnabled && !dueDateEnabled) {
      setStartDate(day);
    } else {
      // Both enabled - click sets due date
      setDueDate(day);
    }
  };

  // Gerar anos para dropdown
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Funções para mini calendário
  const getMiniCalendarDays = () => {
    const monthStart = startOfMonth(miniCalendarDate);
    const monthEnd = endOfMonth(miniCalendarDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const handleQuickSchedule = (type: 'today' | 'tomorrow' | 'week' | 'month') => {
    const today = new Date();
    let date: Date;
    
    switch (type) {
      case 'today': date = today; break;
      case 'tomorrow': date = addDays(today, 1); break;
      case 'week': date = addWeeks(today, 1); break;
      case 'month': date = addMonths(today, 1); break;
      default: date = today;
    }
    
    setSelectedScheduleDate(date);
  };

  const hasScheduledMessageOnDay = (day: Date) => {
    return scheduledMessages.some((msg) => {
      const msgDate = new Date(msg.scheduledAt);
      return isSameDay(day, msgDate);
    });
  };

  const getScheduledMessagesForDay = (day: Date) => {
    return scheduledMessages.filter((msg) => {
      const msgDate = new Date(msg.scheduledAt);
      return isSameDay(day, msgDate);
    });
  };

  const handleMiniCalendarDayClick = (day: Date) => {
    const dayMessages = getScheduledMessagesForDay(day);
    if (dayMessages.length > 0) {
      // Abrir popup com mensagens do dia
      setMiniCalendarPopupDate(day);
      setMiniCalendarPopupMessages(dayMessages);
      setShowMiniCalendarMessagesPopup(true);
    } else {
      // Se não há mensagens, definir como data selecionada para agendar
      setSelectedScheduleDate(day);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMediaSelection = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
  };

  const getMediaType = (file: File): string => {
    if (file.type.startsWith('image/gif')) return 'gif';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const uploadMedia = async (file: File): Promise<{ mediaUrl: string; cloudStoragePath: string } | null> => {
    try {
      // Obter URL presigned para upload
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error('Falha ao obter URL de upload');
      }

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Upload direto para S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': 'attachment',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Falha no upload do arquivo');
      }

      // Obter URL pública do arquivo
      const urlRes = await fetch('/api/upload/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cloudStoragePath: cloud_storage_path,
          isPublic: true,
        }),
      });

      if (!urlRes.ok) {
        throw new Error('Falha ao obter URL do arquivo');
      }

      const { url } = await urlRes.json();

      return { mediaUrl: url, cloudStoragePath: cloud_storage_path };
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  };

  const addScheduledMessage = async () => {
    if (!selectedScheduleDate) {
      toast.error('Selecione uma data');
      return;
    }
    if (!scheduledMessage.trim() && !selectedMedia) {
      toast.error('Digite uma mensagem ou anexe uma mídia');
      return;
    }

    try {
      setUploadingMedia(true);
      
      let mediaData: { mediaUrl: string; cloudStoragePath: string; mediaType: string; mediaName: string } | null = null;
      
      if (selectedMedia) {
        const uploadResult = await uploadMedia(selectedMedia);
        if (uploadResult) {
          mediaData = {
            ...uploadResult,
            mediaType: getMediaType(selectedMedia),
            mediaName: selectedMedia.name,
          };
        } else {
          toast.error('Erro ao fazer upload da mídia');
          setUploadingMedia(false);
          return;
        }
      }

      const res = await fetch('/api/scheduled-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scheduledMessage,
          scheduledAt: selectedScheduleDate.toISOString(),
          cardId,
          ...(mediaData && {
            mediaUrl: mediaData.mediaUrl,
            mediaType: mediaData.mediaType,
            mediaName: mediaData.mediaName,
            cloudStoragePath: mediaData.cloudStoragePath,
            isPublic: true,
          }),
        }),
      });
      const newMessage = await res?.json?.();
      
      setScheduledMessages([...scheduledMessages, newMessage]);
      setScheduledMessage('');
      setSelectedScheduleDate(null);
      clearMediaSelection();
      toast.success('Mensagem agendada com sucesso');
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('Erro ao agendar mensagem');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeScheduledMessage = async (id: string) => {
    try {
      await fetch(`/api/scheduled-messages/${id}`, { method: 'DELETE' });
      setScheduledMessages(scheduledMessages.filter((m) => m.id !== id));
      toast.success('Agendamento removido');
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error removing scheduled message:', error);
      toast.error('Erro ao remover agendamento');
    }
  };

  // Funções para edição de mensagens agendadas
  const startEditingMessage = (msg: ScheduledMessageDB) => {
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.message || '');
    setEditingMessageDate(new Date(msg.scheduledAt));
    setEditingMediaFile(null);
    setEditingMediaPreview(null);
    setExistingMediaUrl(msg.mediaUrl || null);
    setExistingMediaType(msg.mediaType || null);
    setExistingMediaName(msg.mediaName || null);
    setRemoveExistingMedia(false);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
    setEditingMessageDate(null);
    setEditingMediaFile(null);
    setEditingMediaPreview(null);
    setExistingMediaUrl(null);
    setExistingMediaType(null);
    setExistingMediaName(null);
    setRemoveExistingMedia(false);
  };

  const handleEditingMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditingMediaFile(file);
      setRemoveExistingMedia(true); // Se selecionar nova mídia, remove a existente
      
      // Gerar preview
      if (file.type.startsWith('image/') || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditingMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setEditingMediaPreview(URL.createObjectURL(file));
      } else {
        setEditingMediaPreview(null);
      }
    }
  };

  const clearEditingMedia = () => {
    setEditingMediaFile(null);
    setEditingMediaPreview(null);
  };

  const saveEditingMessage = async () => {
    if (!editingMessageId || !editingMessageDate) {
      toast.error('Data é obrigatória');
      return;
    }

    // Verificar se tem texto ou mídia
    const hasText = editingMessageText.trim().length > 0;
    const hasNewMedia = editingMediaFile !== null;
    const hasExistingMedia = existingMediaUrl && !removeExistingMedia;
    
    if (!hasText && !hasNewMedia && !hasExistingMedia) {
      toast.error('Digite uma mensagem ou anexe uma mídia');
      return;
    }

    try {
      setUploadingMedia(true);
      
      let mediaData: { mediaUrl: string; cloudStoragePath: string; mediaType: string; mediaName: string } | null = null;
      
      if (editingMediaFile) {
        const uploadResult = await uploadMedia(editingMediaFile);
        if (uploadResult) {
          mediaData = {
            ...uploadResult,
            mediaType: getMediaType(editingMediaFile),
            mediaName: editingMediaFile.name,
          };
        } else {
          toast.error('Erro ao fazer upload da mídia');
          setUploadingMedia(false);
          return;
        }
      }

      const updatePayload: any = {
        message: editingMessageText,
        scheduledAt: editingMessageDate.toISOString(),
      };

      // Se tem nova mídia, atualiza os campos de mídia
      if (mediaData) {
        updatePayload.mediaUrl = mediaData.mediaUrl;
        updatePayload.mediaType = mediaData.mediaType;
        updatePayload.mediaName = mediaData.mediaName;
        updatePayload.cloudStoragePath = mediaData.cloudStoragePath;
        updatePayload.isPublic = true;
      } else if (removeExistingMedia) {
        // Se quer remover mídia existente sem adicionar nova
        updatePayload.mediaUrl = null;
        updatePayload.mediaType = null;
        updatePayload.mediaName = null;
        updatePayload.cloudStoragePath = null;
      }

      const res = await fetch(`/api/scheduled-messages/${editingMessageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar mensagem');
      }

      const updatedMessage = await res.json();
      
      // Atualizar lista local
      setScheduledMessages(scheduledMessages.map(m => 
        m.id === editingMessageId ? updatedMessage : m
      ));
      
      // Também atualizar popup se estiver aberto
      if (showMiniCalendarMessagesPopup) {
        setMiniCalendarPopupMessages(prev => 
          prev.map(m => m.id === editingMessageId ? updatedMessage : m)
        );
      }
      
      cancelEditingMessage();
      toast.success('Mensagem atualizada com sucesso');
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Error updating scheduled message:', error);
      toast.error('Erro ao atualizar mensagem');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Filtrar etiquetas por busca
  const filteredLabels = allLabels.filter(label => 
    label.name.toLowerCase().includes(labelSearch.toLowerCase())
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white p-0">
        {/* Header com lista dropdown */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{card?.list?.title ?? 'Lista'}</span>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-zinc-800 rounded">
              <Settings className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Checkbox e Título */}
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-5 h-5 border-2 border-zinc-600 rounded-full hover:border-zinc-400 cursor-pointer" />
            </div>
            <Input
              value={title ?? ''}
              onChange={(e) => setTitle(e?.target?.value ?? '')}
              onBlur={() => title !== card?.title && updateCard({ title })}
              className="text-xl font-medium border-none bg-transparent px-0 focus-visible:ring-0 text-white placeholder:text-zinc-500"
              placeholder="Título do cartão"
            />
          </div>

          {/* Botões de ação em linha */}
          <div className="flex flex-wrap gap-2 relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePopover(activePopover === 'add' ? null : 'add')}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Tag className="h-4 w-4 mr-1" />
              Etiquetas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Datas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePopover(activePopover === 'checklist' ? null : 'checklist')}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Checklist
            </Button>

            {/* Popover: Adicionar ao cartão */}
            {activePopover === 'add' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                  <span className="text-sm font-medium">Adicionar ao cartão</span>
                  <button onClick={() => setActivePopover(null)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => { setActivePopover('labels'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 rounded text-left"
                  >
                    <Tag className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Etiquetas</p>
                      <p className="text-xs text-zinc-500">Organize, categorize e priorize</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActivePopover('dates'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 rounded text-left"
                  >
                    <Calendar className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Datas</p>
                      <p className="text-xs text-zinc-500">Datas de início, datas de entrega</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActivePopover('checklist'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 rounded text-left"
                  >
                    <CheckSquare className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Checklist</p>
                      <p className="text-xs text-zinc-500">Adicionar subtarefas</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowMiniCalendar(true); setActivePopover(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 rounded text-left"
                  >
                    <Send className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Agendar Mensagem</p>
                      <p className="text-xs text-zinc-500">Programe mensagens para o cliente</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Popover: Etiquetas */}
            {activePopover === 'labels' && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                  <span className="text-sm font-medium">Etiquetas</span>
                  <button onClick={() => setActivePopover(null)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Buscar etiquetas..."
                      value={labelSearch}
                      onChange={(e) => setLabelSearch(e.target.value)}
                      className="pl-9 bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Lista de etiquetas */}
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    <p className="text-xs text-zinc-500 font-medium px-1">Etiquetas</p>
                    {filteredLabels.map((label: any) => {
                      const isSelected = (card?.labels ?? []).some((l: any) => l.id === label.id);
                      const isEditing = editingLabelId === label.id;

                      if (isEditing) {
                        return (
                          <div key={label.id} className="p-2 bg-zinc-700 rounded space-y-2">
                            <Input
                              value={editingLabelText}
                              onChange={(e) => setEditingLabelText(e.target.value)}
                              className="bg-zinc-600 border-zinc-500 text-white text-sm"
                              autoFocus
                            />
                            <div className="flex flex-wrap gap-1">
                              {LABEL_COLORS.map((c) => (
                                <button
                                  key={c.color}
                                  onClick={() => updateLabel(label.id, editingLabelText, c.color)}
                                  className="w-8 h-6 rounded transition-all hover:scale-110"
                                  style={{ backgroundColor: c.color }}
                                  title={`Salvar como ${c.name}`}
                                />
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingLabelId(null)}>
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={() => updateLabel(label.id, editingLabelText, label.color)}>
                                Salvar
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={label.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleLabelOnCard(label.id)}
                            className="border-zinc-600 data-[state=checked]:bg-blue-600"
                          />
                          <button
                            onClick={() => toggleLabelOnCard(label.id)}
                            className="flex-1 py-2 px-3 rounded text-white text-sm font-medium text-left hover:opacity-90"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name || ' '}
                          </button>
                          <button
                            onClick={() => {
                              setEditingLabelId(label.id);
                              setEditingLabelText(label.name);
                            }}
                            className="p-1.5 hover:bg-zinc-700 rounded"
                          >
                            <Edit2 className="h-4 w-4 text-zinc-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Criar nova etiqueta */}
                  {showCreateLabel ? (
                    <div className="p-3 bg-zinc-700 rounded space-y-3">
                      <Input
                        placeholder="Texto da etiqueta..."
                        value={newLabelText}
                        onChange={(e) => setNewLabelText(e.target.value)}
                        className="bg-zinc-600 border-zinc-500 text-white"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1">
                        {LABEL_COLORS.map((c) => (
                          <button
                            key={c.color}
                            onClick={() => setSelectedLabelColor(c.color)}
                            className={`w-10 h-8 rounded transition-all ${
                              selectedLabelColor === c.color ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-700' : ''
                            }`}
                            style={{ backgroundColor: c.color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={createLabel} className="flex-1">
                          Criar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCreateLabel(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateLabel(true)}
                      className="w-full py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                    >
                      Criar uma nova etiqueta
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Popover: Datas */}
            {activePopover === 'dates' && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                  <span className="text-sm font-medium">Datas</span>
                  <button onClick={() => setActivePopover(null)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  {/* Calendário */}
                  <div className="bg-zinc-700 rounded-lg p-3">
                    {/* Navegação do mês */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDatesCalendarDate(subMonths(datesCalendarDate, 12))} className="p-1 hover:bg-zinc-600 rounded">
                          <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDatesCalendarDate(subMonths(datesCalendarDate, 1))} className="p-1 hover:bg-zinc-600 rounded">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 relative">
                        {/* Month dropdown */}
                        <button
                          onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }}
                          className="px-2 py-1 hover:bg-zinc-600 rounded text-sm font-medium"
                        >
                          {MONTHS[getMonth(datesCalendarDate)]}
                        </button>
                        {showMonthDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-700 border border-zinc-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                            {MONTHS.map((month, idx) => (
                              <button
                                key={month}
                                onClick={() => {
                                  setDatesCalendarDate(setMonth(datesCalendarDate, idx));
                                  setShowMonthDropdown(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-600 ${
                                  getMonth(datesCalendarDate) === idx ? 'bg-blue-600' : ''
                                }`}
                              >
                                {month}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Year dropdown */}
                        <button
                          onClick={() => { setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }}
                          className="px-2 py-1 hover:bg-zinc-600 rounded text-sm font-medium"
                        >
                          {getYear(datesCalendarDate)}
                        </button>
                        {showYearDropdown && (
                          <div className="absolute top-full right-0 mt-1 w-20 bg-zinc-700 border border-zinc-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                            {years.map((year) => (
                              <button
                                key={year}
                                onClick={() => {
                                  setDatesCalendarDate(setYear(datesCalendarDate, year));
                                  setShowYearDropdown(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-600 ${
                                  getYear(datesCalendarDate) === year ? 'bg-blue-600' : ''
                                }`}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDatesCalendarDate(addMonths(datesCalendarDate, 1))} className="p-1 hover:bg-zinc-600 rounded">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDatesCalendarDate(addMonths(datesCalendarDate, 12))} className="p-1 hover:bg-zinc-600 rounded">
                          <ChevronsRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
                      {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((day) => (
                        <div key={day} className="text-zinc-500 py-1">{day}</div>
                      ))}
                    </div>
                    
                    {/* Dias do mês */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startOfMonth(datesCalendarDate).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      
                      {getDatesCalendarDays().map((day) => {
                        const isTodayDate = isToday(day);
                        const isStart = startDate && isSameDay(day, startDate);
                        const isDue = dueDate && isSameDay(day, dueDate);
                        
                        return (
                          <button
                            key={day.toString()}
                            onClick={() => handleDateClick(day)}
                            className={`p-1.5 rounded text-sm transition-all ${
                              isDue
                                ? 'bg-blue-600 text-white'
                                : isStart
                                ? 'bg-purple-600 text-white'
                                : isTodayDate
                                ? 'bg-zinc-500 font-bold'
                                : 'hover:bg-zinc-600'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Data de início */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-medium">Data de início</p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={startDateEnabled}
                        onCheckedChange={(checked) => setStartDateEnabled(!!checked)}
                        className="border-zinc-600 data-[state=checked]:bg-blue-600"
                      />
                      <Input
                        type="text"
                        placeholder="D/M/AAAA"
                        value={startDate && startDateEnabled ? format(startDate, 'dd/MM/yyyy') : ''}
                        readOnly
                        className="flex-1 bg-zinc-700 border-zinc-600 text-white text-sm"
                        disabled={!startDateEnabled}
                      />
                    </div>
                  </div>

                  {/* Data de entrega */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-medium">Data de entrega</p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={dueDateEnabled}
                        onCheckedChange={(checked) => setDueDateEnabled(!!checked)}
                        className="border-zinc-600 data-[state=checked]:bg-blue-600"
                      />
                      <Input
                        type="text"
                        placeholder="D/M/AAAA"
                        value={dueDate && dueDateEnabled ? format(dueDate, 'dd/MM/yyyy') : ''}
                        readOnly
                        className="flex-1 bg-zinc-700 border-zinc-600 text-white text-sm"
                        disabled={!dueDateEnabled}
                      />
                      <Input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-24 bg-zinc-700 border-zinc-600 text-white text-sm"
                        disabled={!dueDateEnabled}
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="space-y-2">
                    <Button onClick={saveDates} className="w-full bg-blue-600 hover:bg-blue-700">
                      Salvar
                    </Button>
                    <Button onClick={removeDates} variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-zinc-700">
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Popover: Checklist */}
            {activePopover === 'checklist' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                  <span className="text-sm font-medium">Adicionar checklist</span>
                  <button onClick={() => setActivePopover(null)} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <Label className="text-xs text-zinc-400">Título</Label>
                    <Input
                      placeholder="Nome da checklist"
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      className="mt-1 bg-zinc-700 border-zinc-600 text-white"
                      autoFocus
                    />
                  </div>
                  <Button onClick={createChecklist} className="w-full bg-blue-600 hover:bg-blue-700">
                    Adicionar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Etiquetas do cartão */}
          {(card?.labels ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(card?.labels ?? []).map((label: any) => (
                <Badge
                  key={label?.id}
                  style={{ backgroundColor: label?.color ?? '#000' }}
                  className="text-white text-xs px-3 py-1"
                >
                  {label?.name ?? ''}
                </Badge>
              ))}
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-5 h-5 flex items-center justify-center">≡</div>
              <span className="text-sm font-medium">Descrição</span>
            </div>
            <Textarea
              value={description ?? ''}
              onChange={(e) => setDescription(e?.target?.value ?? '')}
              onBlur={() => description !== card?.description && updateCard({ description })}
              placeholder="Adicione uma descrição mais detalhada..."
              className="min-h-[80px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
            />
          </div>

          {/* Checklists */}
          {(card?.checklists ?? []).length > 0 && (
            <div className="space-y-4">
              {(card?.checklists ?? []).map((checklist: any) => {
                const total = checklist?.items?.length ?? 0;
                const completed = (checklist?.items ?? []).filter((i: any) => i?.completed)?.length ?? 0;
                const progress = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <div key={checklist?.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-zinc-400" />
                        <span className="font-medium">{checklist?.title ?? ''}</span>
                      </div>
                      <span className="text-sm text-zinc-500">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-8">{Math.round(progress)}%</span>
                      <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1 pl-2">
                      {(checklist?.items ?? []).map((item: any) => (
                        <div key={item?.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={item?.completed ?? false}
                            onCheckedChange={(checked) => toggleChecklistItem(item?.id ?? '', !!checked)}
                            className="border-zinc-600 data-[state=checked]:bg-blue-600"
                          />
                          <span className={`text-sm ${item?.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                            {item?.text ?? ''}
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={() => addChecklistItem(checklist.id)}
                        className="text-sm text-zinc-500 hover:text-white py-1"
                      >
                        Adicionar um item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini Calendário para Agendamento de Mensagens */}
          {showMiniCalendar && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Agendar Mensagem
                </Label>
                <button onClick={() => setShowMiniCalendar(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Atalhos rápidos */}
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickSchedule('today')}
                  className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600">
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSchedule('tomorrow')}
                  className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600">
                  Amanhã
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSchedule('week')}
                  className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600">
                  +1 Sem
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSchedule('month')}
                  className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600">
                  +1 Mês
                </Button>
              </div>

              {/* Mini calendário */}
              <div className="bg-zinc-700 rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="ghost" size="sm" onClick={() => setMiniCalendarDate(subMonths(miniCalendarDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(miniCalendarDate, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-zinc-500 py-1">{day}</div>
                  ))}
                  
                  {Array.from({ length: startOfMonth(miniCalendarDate).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  
                  {getMiniCalendarDays().map((day) => {
                    const isSelected = selectedScheduleDate && isSameDay(day, selectedScheduleDate);
                    const isTodayDate = isToday(day);
                    const hasMessage = hasScheduledMessageOnDay(day);
                    const msgCount = getScheduledMessagesForDay(day).length;
                    
                    return (
                      <button
                        key={day.toString()}
                        onClick={() => handleMiniCalendarDayClick(day)}
                        className={`p-1 rounded text-xs relative transition-all ${
                          isSelected ? 'bg-blue-600 text-white' :
                          isTodayDate ? 'bg-zinc-500 font-bold' :
                          hasMessage ? 'bg-pink-500/40 ring-1 ring-pink-400' :
                          'hover:bg-zinc-600'
                        }`}
                        title={hasMessage ? `${msgCount} mensagem(ns) agendada(s)` : ''}
                      >
                        {format(day, 'd')}
                        {hasMessage && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mensagens do dia selecionado */}
              {selectedScheduleDate && getScheduledMessagesForDay(selectedScheduleDate).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-orange-400">Mensagens neste dia</p>
                  {getScheduledMessagesForDay(selectedScheduleDate).map((msg) => (
                    <div key={msg.id} className="p-2 bg-orange-500/20 rounded text-xs border border-orange-500/40">
                      {msg.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Agendar nova mensagem */}
              {selectedScheduleDate && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Data: <span className="text-white font-medium">
                      {format(selectedScheduleDate, "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </p>
                  <Textarea
                    placeholder="Digite a mensagem..."
                    value={scheduledMessage}
                    onChange={(e) => setScheduledMessage(e.target.value)}
                    className="min-h-[60px] bg-zinc-700 border-zinc-600 text-white text-sm"
                  />
                  
                  {/* Upload de mídia */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-medium">Anexar mídia (opcional)</p>
                    <div className="flex items-center gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*,video/*,.gif"
                          onChange={handleMediaSelect}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 p-2 bg-zinc-700 border border-zinc-600 rounded-lg cursor-pointer hover:bg-zinc-600 transition-colors">
                          <Upload className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-zinc-400">
                            {selectedMedia ? selectedMedia.name : 'Selecionar arquivo'}
                          </span>
                        </div>
                      </label>
                      {selectedMedia && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearMediaSelection}
                          className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Preview da mídia */}
                    {mediaPreview && (
                      <div className="relative bg-zinc-700 rounded-lg p-2">
                        {selectedMedia?.type.startsWith('image/') ? (
                          <img 
                            src={mediaPreview} 
                            alt="Preview" 
                            className="max-h-32 mx-auto rounded object-contain"
                          />
                        ) : selectedMedia?.type.startsWith('video/') ? (
                          <video 
                            src={mediaPreview} 
                            className="max-h-32 mx-auto rounded" 
                            controls
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2 py-4">
                            <FileText className="h-8 w-8 text-zinc-400" />
                            <span className="text-sm text-zinc-400">{selectedMedia?.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Dicas de tipos aceitos */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" /> Imagens
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" /> Vídeos
                      </span>
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" /> GIFs
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={addScheduledMessage} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={uploadingMedia}
                  >
                    {uploadingMedia ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Agendar
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Lista de todas as mensagens agendadas */}
              {scheduledMessages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Mensagens agendadas ({scheduledMessages.length})
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {scheduledMessages.map((msg) => (
                      <div key={msg.id} className="p-2 bg-zinc-700 rounded text-xs">
                        {editingMessageId === msg.id ? (
                          // Interface de edição
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs">Editando mensagem de</span>
                              <span className="text-blue-400 font-medium">
                                {format(editingMessageDate || new Date(msg.scheduledAt), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            
                            {/* Textarea para mensagem */}
                            <Textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              placeholder="Digite sua mensagem..."
                              className="bg-zinc-800 border-zinc-600 text-white text-xs min-h-[60px] resize-none"
                            />
                            
                            {/* Seção de mídia */}
                            <div className="space-y-2">
                              {/* Mídia existente */}
                              {existingMediaUrl && !removeExistingMedia && !editingMediaFile && (
                                <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {existingMediaType === 'image' || existingMediaType === 'gif' ? (
                                      <Image className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                    ) : existingMediaType === 'video' ? (
                                      <Video className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                    )}
                                    <span className="text-zinc-300 truncate text-xs">
                                      {existingMediaName || 'Mídia anexada'}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => setRemoveExistingMedia(true)}
                                    className="text-red-400 hover:text-red-300 flex-shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              
                              {/* Preview da nova mídia */}
                              {editingMediaFile && (
                                <div className="relative">
                                  {editingMediaPreview && (
                                    <div className="mb-2">
                                      {editingMediaFile.type.startsWith('video/') ? (
                                        <video 
                                          src={editingMediaPreview} 
                                          className="max-h-24 rounded object-cover"
                                          controls
                                        />
                                      ) : (
                                        <img 
                                          src={editingMediaPreview} 
                                          alt="Preview" 
                                          className="max-h-24 rounded object-cover"
                                        />
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
                                    <Paperclip className="h-4 w-4 text-pink-400 flex-shrink-0" />
                                    <span className="text-zinc-300 truncate text-xs flex-1">
                                      {editingMediaFile.name}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        clearEditingMedia();
                                        setRemoveExistingMedia(false);
                                      }}
                                      className="text-red-400 hover:text-red-300 flex-shrink-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Botão para adicionar/trocar mídia */}
                              {!editingMediaFile && (
                                <label className="flex items-center gap-2 p-2 bg-zinc-800 hover:bg-zinc-750 rounded cursor-pointer transition-colors">
                                  <Upload className="h-4 w-4 text-zinc-400" />
                                  <span className="text-zinc-400 text-xs">
                                    {existingMediaUrl && !removeExistingMedia ? 'Trocar mídia' : 'Anexar mídia'}
                                  </span>
                                  <span className="text-zinc-500 text-xs">(imagem, vídeo, GIF, banner)</span>
                                  <input
                                    type="file"
                                    accept="image/*,video/*,.gif"
                                    onChange={handleEditingMediaSelect}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                            
                            {/* Botões de ação */}
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditingMessage}
                                className="text-zinc-400 hover:text-white hover:bg-zinc-600 text-xs h-7"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={saveEditingMessage}
                                disabled={uploadingMedia}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                              >
                                {uploadingMedia ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  'Salvar'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Visualização normal
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-medium">
                                  {format(new Date(msg.scheduledAt), 'dd/MM')}
                                </span>
                                {msg.mediaType && (
                                  <span className="flex items-center gap-1 text-pink-400">
                                    {msg.mediaType === 'image' || msg.mediaType === 'gif' ? (
                                      <Image className="h-3 w-3" />
                                    ) : msg.mediaType === 'video' ? (
                                      <Video className="h-3 w-3" />
                                    ) : (
                                      <Paperclip className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                              <span className="text-zinc-400 truncate block">
                                {msg.message ? msg.message.substring(0, 30) + (msg.message.length > 30 ? '...' : '') : (msg.mediaName || 'Mídia anexada')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button 
                                onClick={() => startEditingMessage(msg)} 
                                className="text-zinc-400 hover:text-blue-400 p-1"
                                title="Editar mensagem"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => removeScheduledMessage(msg.id)} 
                                className="text-zinc-400 hover:text-red-400 p-1"
                                title="Remover mensagem"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Abas inferiores */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('power-ups')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'power-ups' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Zap className="h-4 w-4" />
                Power-ups
              </button>
              <button
                onClick={() => setActiveTab('automations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'automations' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                Automações
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'comments' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Comentários
              </button>
            </div>

            {/* Conteúdo das abas */}
            <div className="min-h-[120px]">
              {activeTab === 'power-ups' && (
                <div className="text-center py-6 text-zinc-500">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum Power-up ativo</p>
                  <p className="text-xs mt-1">Power-ups adicionam recursos extras aos seus cartões</p>
                </div>
              )}
              
              {activeTab === 'automations' && (
                <div className="text-center py-6 text-zinc-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma automação configurada</p>
                  <p className="text-xs mt-1">Automações executam ações automaticamente</p>
                </div>
              )}
              
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  <Button size="sm" variant="outline" onClick={addComment}
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar comentário
                  </Button>
                  
                  {(card?.comments ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(card?.comments ?? []).map((comment: any) => (
                        <div key={comment?.id} className="p-3 bg-zinc-800 rounded-lg">
                          <p className="text-sm text-zinc-300">{comment?.content ?? ''}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {comment?.createdAt ? format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', { locale: ptBR }) : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Nenhum comentário ainda</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ações do cartão */}
          <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={duplicateCard}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              <Copy className="h-4 w-4 mr-1" />
              Duplicar
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteCard}>
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Popup de Mensagens Agendadas do Mini-Calendário */}
        {showMiniCalendarMessagesPopup && miniCalendarPopupDate && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]" 
            onClick={() => setShowMiniCalendarMessagesPopup(false)}
          >
            <div 
              className="w-full max-w-md mx-4 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                <div>
                  <div className="flex items-center gap-2 text-pink-400">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-semibold">Mensagens Agendadas</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {format(miniCalendarPopupDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowMiniCalendarMessagesPopup(false)} 
                  className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {miniCalendarPopupMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(msg.scheduledAt), 'HH:mm', { locale: ptBR })}
                        </Badge>
                        {msg.mediaType && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
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
                      </div>
                      <button 
                        onClick={() => {
                          removeScheduledMessage(msg.id);
                          setMiniCalendarPopupMessages(miniCalendarPopupMessages.filter(m => m.id !== msg.id));
                          if (miniCalendarPopupMessages.length <= 1) {
                            setShowMiniCalendarMessagesPopup(false);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remover agendamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Mídia anexada */}
                    {msg.mediaUrl && (
                      <div className="mb-2 bg-zinc-900/50 rounded-lg p-2">
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
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                          >
                            <FileText className="h-5 w-5" />
                            <span>{msg.mediaName || 'Arquivo anexado'}</span>
                          </a>
                        )}
                      </div>
                    )}
                    
                    {/* Mensagem de texto */}
                    {msg.message && (
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-700 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedScheduleDate(miniCalendarPopupDate);
                    setShowMiniCalendarMessagesPopup(false);
                  }}
                  className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar neste dia
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMiniCalendarMessagesPopup(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
