import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageCircle, Download, Users, Phone, Clock, Search, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminPagination from './admin/AdminPagination';

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

interface Offer {
  id: string;
  title: string;
}

const ITEMS_PER_PAGE = 15;
const MAX_EXPORT_ITEMS = 10000;

export default function CompanyLeadsList() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);

  // Fetch company offers for filter dropdown
  const fetchOffers = useCallback(async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('offers')
      .select('id, title')
      .eq('company_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (data) setOffers(data);
  }, [profile?.id]);

  // Fetch leads with pagination and filters
  const fetchLeads = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Get company's offer IDs first
      const { data: companyOffers } = await supabase
        .from('offers')
        .select('id')
        .eq('company_id', profile.id);

      if (!companyOffers || companyOffers.length === 0) {
        setLeads([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const offerIds = companyOffers.map(o => o.id);
      
      // Build base query
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone_whatsapp,
          created_at,
          is_valid,
          offer_id,
          offers!inner(title)
        `, { count: 'exact' })
        .in('offer_id', offerIds)
        .eq('is_valid', true);
      
      // Apply offer filter
      if (selectedOffer !== 'all') {
        query = query.eq('offer_id', selectedOffer);
      }
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        
        switch (dateFilter) {
          case '7days':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }
        
        query = query.gte('created_at', dateFrom.toISOString());
      }
      
      // Apply search filter (name or phone)
      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`name.ilike.%${term}%,phone_whatsapp.ilike.%${term}%`);
      }
      
      // Apply pagination and ordering
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id, currentPage, selectedOffer, dateFilter, searchTerm, toast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOffer, dateFilter, searchTerm]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  const handleExportCSV = async () => {
    if (totalCount === 0) {
      toast({
        title: 'Nenhum lead',
        description: 'Não há leads para exportar.',
        variant: 'destructive',
      });
      return;
    }

    if (totalCount > MAX_EXPORT_ITEMS) {
      toast({
        title: 'Muitos leads',
        description: `Use os filtros para reduzir a ${MAX_EXPORT_ITEMS.toLocaleString()} leads ou menos.`,
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    
    try {
      // Fetch all filtered leads for export (up to MAX_EXPORT_ITEMS)
      const { data: companyOffers } = await supabase
        .from('offers')
        .select('id')
        .eq('company_id', profile?.id);

      if (!companyOffers || companyOffers.length === 0) {
        throw new Error('Nenhuma oferta encontrada');
      }

      const offerIds = companyOffers.map(o => o.id);
      
      let query = supabase
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
        .eq('is_valid', true);
      
      if (selectedOffer !== 'all') {
        query = query.eq('offer_id', selectedOffer);
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        
        switch (dateFilter) {
          case '7days':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }
        
        query = query.gte('created_at', dateFrom.toISOString());
      }
      
      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`name.ilike.%${term}%,phone_whatsapp.ilike.%${term}%`);
      }
      
      const { data: exportLeads, error } = await query
        .order('created_at', { ascending: false })
        .limit(MAX_EXPORT_ITEMS);

      if (error) throw error;
      
      if (!exportLeads || exportLeads.length === 0) {
        throw new Error('Nenhum lead encontrado');
      }

      const headers = ['Nome', 'WhatsApp', 'Oferta', 'Data'];
      const rows = exportLeads.map(lead => [
        lead.name,
        formatPhone(lead.phone_whatsapp),
        lead.offers?.title || '',
        new Date(lead.created_at).toLocaleDateString('pt-BR'),
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Exportado!',
        description: `${exportLeads.length} leads exportados com sucesso.`,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os leads.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedOffer('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm || selectedOffer !== 'all' || dateFilter !== 'all';
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && leads.length === 0) {
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Meus Leads
            <Badge variant="secondary" className="ml-2">
              {totalCount.toLocaleString()}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-accent' : ''}
            >
              <Filter className="h-3 w-3 mr-1" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
            {totalCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={exporting}
                className="text-xs"
              >
                {exporting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                CSV
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              
              {/* Offer filter */}
              <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Todas ofertas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ofertas</SelectItem>
                  {offers.map(offer => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.title.length > 25 ? offer.title.slice(0, 25) + '...' : offer.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Date filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-9">
                  <SelectValue placeholder="Todo período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="90days">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            {hasActiveFilters ? (
              <>
                <p className="text-sm">Nenhum lead encontrado com esses filtros.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm">Nenhum lead ainda.</p>
                <p className="text-xs mt-1">Os leads aparecerão aqui quando interessados preencherem o formulário.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {leads.map((lead) => (
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
            </div>

            {/* Pagination */}
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
