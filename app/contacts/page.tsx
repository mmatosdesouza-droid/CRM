'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, Mail, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    const filtered = (contacts ?? []).filter((contact) =>
      (contact?.name ?? '')?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
      (contact?.company ?? '')?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
      (contact?.email ?? '')?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '')
    );
    setFilteredContacts(filtered ?? []);
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res?.json?.();
      setContacts(data ?? []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData?.name?.trim?.()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const url = editingContact ? `/api/contacts/${editingContact?.id}` : '/api/contacts';
      const method = editingContact ? 'PATCH' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      toast.success(editingContact ? 'Contato atualizado' : 'Contato criado');
      setIsDialogOpen(false);
      setEditingContact(null);
      setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erro ao salvar contato');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      toast.success('Contato excluído');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao excluir contato');
    }
  };

  const openEditDialog = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      company: contact?.company ?? '',
      notes: contact?.notes ?? '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os seus contatos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingContact(null); setFormData({ name: '', email: '', phone: '', company: '', notes: '' }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData?.name ?? ''} onChange={(e) => setFormData({ ...formData, name: e?.target?.value ?? '' })} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData?.email ?? ''} onChange={(e) => setFormData({ ...formData, email: e?.target?.value ?? '' })} />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData?.phone ?? ''} onChange={(e) => setFormData({ ...formData, phone: e?.target?.value ?? '' })} />
              </div>
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" value={formData?.company ?? ''} onChange={(e) => setFormData({ ...formData, company: e?.target?.value ?? '' })} />
              </div>
              <div>
                <Label htmlFor="notes">Anotações</Label>
                <Textarea id="notes" value={formData?.notes ?? ''} onChange={(e) => setFormData({ ...formData, notes: e?.target?.value ?? '' })} />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingContact ? 'Atualizar' : 'Criar'} Contato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={searchTerm ?? ''}
          onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(filteredContacts ?? []).map((contact) => (
          <Card key={contact?.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{contact?.name ?? ''}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(contact)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(contact?.id ?? '')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact?.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.company}</span>
                </div>
              )}
              {contact?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {(contact?.labels ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {(contact?.labels ?? []).map((label: any) => (
                    <Badge key={label?.id} style={{ backgroundColor: label?.color ?? '#000', color: '#fff' }}>
                      {label?.name ?? ''}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
