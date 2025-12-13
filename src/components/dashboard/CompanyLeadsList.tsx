import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Download, Users, Phone, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  phone_whatsapp: string;
  created_at: string;
  is_valid: boolean;
  offer_id: string;
  offers?: {
    title: string;
  };
}

export default function CompanyLeadsList() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [profile?.id]);

  const fetchLeads = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Get company's offer IDs first
      const { data: offers } = await supabase
        .from('offers')
        .select('id')
        .eq('company_id', profile.id);

      if (!offers || offers.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const offerIds = offers.map(o => o.id);

      // Fetch leads for those offers
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone_whatsapp,
          created_at,
          is_valid,
          offer_id,
          offers!inner(title)
        `)
        .in('offer_id', offerIds)
        .eq('is_valid', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string): string => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleWhatsApp = (lead: Lead) => {
    const message = `Olá ${lead.name.split(' ')[0]}! 👋

Vi que você se interessou pela nossa oferta "${lead.offers?.title}"!

Posso te ajudar com mais informações?`;

    const url = `https://wa.me/55${lead.phone_whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast({
        title: 'Nenhum lead',
        description: 'Não há leads para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Nome', 'WhatsApp', 'Oferta', 'Data'];
    const rows = leads.map(lead => [
      lead.name,
      formatPhone(lead.phone_whatsapp),
      lead.offers?.title || '',
      new Date(lead.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Exportado!',
      description: `${leads.length} leads exportados com sucesso.`,
    });
  };

  const displayedLeads = showAll ? leads : leads.slice(0, 5);
  const totalLeads = leads.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Meus Leads
            <Badge variant="secondary" className="ml-2">
              {totalLeads}
            </Badge>
          </CardTitle>
          {totalLeads > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {totalLeads === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum lead ainda.</p>
            <p className="text-xs mt-1">Os leads aparecerão aqui quando interessados preencherem o formulário.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhone(lead.phone_whatsapp)}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {lead.offers?.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white shrink-0 ml-2"
                  onClick={() => handleWhatsApp(lead)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              </div>
            ))}

            {totalLeads > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver todos os {totalLeads} leads
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
