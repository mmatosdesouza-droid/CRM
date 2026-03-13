'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    const filtered = (deals ?? []).filter((deal) =>
      (deal?.title ?? '')?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '')
    );
    setFilteredDeals(filtered ?? []);
  }, [searchTerm, deals]);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      const data = await res?.json?.();
      setDeals(data ?? []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      lead: { label: 'Lead', className: 'bg-blue-500' },
      in_progress: { label: 'Em Andamento', className: 'bg-yellow-500' },
      won: { label: 'Ganho', className: 'bg-green-500' },
      lost: { label: 'Perdido', className: 'bg-red-500' },
    };
    const variant = variants[status ?? 'lead'] ?? variants.lead;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Negócios</h1>
          <p className="text-muted-foreground mt-1">Acompanhe todos os seus negócios</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar negócios..."
          value={searchTerm ?? ''}
          onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(filteredDeals ?? []).map((deal) => (
          <Card key={deal?.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{deal?.title ?? ''}</CardTitle>
                {getStatusBadge(deal?.status ?? 'lead')}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-primary">
                R$ {(deal?.value ?? 0)?.toLocaleString?.('pt-BR')}
              </div>
              {deal?.contact && (
                <p className="text-sm text-muted-foreground">
                  Contato: {deal.contact.name}
                </p>
              )}
              {deal?.expectedCloseDate && (
                <p className="text-sm text-muted-foreground">
                  Fechamento: {format(new Date(deal.expectedCloseDate), 'dd MMM yyyy', { locale: ptBR })}
                </p>
              )}
              {(deal?.labels ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {(deal?.labels ?? []).map((label: any) => (
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
