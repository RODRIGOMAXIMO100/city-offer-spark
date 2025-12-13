import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminPagination, { usePagination } from './AdminPagination';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Users, 
  CheckCircle, 
  Calendar,
  Building2,
  MapPin,
  Tag,
  Phone,
  Filter,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface LeadData {
  id: string;
  name: string;
  phone_whatsapp: string;
  created_at: string;
  is_valid: boolean;
  offer_id: string;
  affiliate_id: string | null;
  offer_title?: string;
  offer_tags?: string[];
  company_name?: string;
  company_id?: string;
  city?: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [validFilter, setValidFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalLeads: 0,
    validLeads: 0,
    weeklyLeads: 0,
    monthlyLeads: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchLeads(),
      fetchCompanies(),
      fetchFiltersData()
    ]);
    setLoading(false);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone_whatsapp,
          created_at,
          is_valid,
          offer_id,
          affiliate_id,
          offers:offer_id (
            title,
            tags,
            city,
            company_id,
            profiles:company_id (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const formattedLeads: LeadData[] = data?.map(lead => ({
        id: lead.id,
        name: lead.name,
        phone_whatsapp: lead.phone_whatsapp,
        created_at: lead.created_at || '',
        is_valid: lead.is_valid ?? true,
        offer_id: lead.offer_id,
        affiliate_id: lead.affiliate_id,
        offer_title: (lead.offers as any)?.title || 'N/A',
        offer_tags: (lead.offers as any)?.tags || [],
        company_name: (lead.offers as any)?.profiles?.name || 'N/A',
        company_id: (lead.offers as any)?.company_id,
        city: (lead.offers as any)?.city || 'N/A'
      })) || [];

      setLeads(formattedLeads);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      setStats({
        totalLeads: formattedLeads.length,
        validLeads: formattedLeads.filter(l => l.is_valid).length,
        weeklyLeads: formattedLeads.filter(l => new Date(l.created_at) >= weekAgo).length,
        monthlyLeads: formattedLeads.filter(l => new Date(l.created_at) >= monthAgo).length
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', (await supabase.from('user_roles').select('user_id').eq('role', 'COMPANY')).data?.map(r => r.user_id) || []);
      
      setCompanies(data?.map(p => ({ id: p.id, name: p.name })) || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const { data: offersData } = await supabase
        .from('offers')
        .select('city, tags');
      
      const uniqueCities = [...new Set(offersData?.map(o => o.city).filter(Boolean))].sort();
      const uniqueTags = [...new Set(offersData?.flatMap(o => o.tags || []).filter(Boolean))].sort();
      
      setCities(uniqueCities);
      setAllTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchTerm || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone_whatsapp.includes(searchTerm) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.offer_title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = companyFilter === 'all' || lead.company_id === companyFilter;
      const matchesCity = cityFilter === 'all' || lead.city === cityFilter;
      const matchesTag = tagFilter === 'all' || lead.offer_tags?.includes(tagFilter);
      const matchesValid = validFilter === 'all' || 
        (validFilter === 'valid' && lead.is_valid) || 
        (validFilter === 'invalid' && !lead.is_valid);
      
      const leadDate = new Date(lead.created_at);
      const matchesDateFrom = !dateFrom || leadDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || leadDate <= new Date(dateTo + 'T23:59:59');
      
      return matchesSearch && matchesCompany && matchesCity && matchesTag && matchesValid && matchesDateFrom && matchesDateTo;
    });
  }, [leads, searchTerm, companyFilter, cityFilter, tagFilter, validFilter, dateFrom, dateTo]);

  const pagination = usePagination(filteredLeads, 20);

  // Charts data
  const leadsByCompany = useMemo(() => {
    const grouped = filteredLeads.reduce((acc, lead) => {
      const company = lead.company_name || 'N/A';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name: name.substring(0, 15), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredLeads]);

  const leadsByCity = useMemo(() => {
    const grouped = filteredLeads.reduce((acc, lead) => {
      const city = lead.city || 'N/A';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name: name.substring(0, 15), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredLeads]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  const clearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('all');
    setCityFilter('all');
    setTagFilter('all');
    setValidFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || companyFilter !== 'all' || cityFilter !== 'all' || 
    tagFilter !== 'all' || validFilter !== 'all' || dateFrom || dateTo;

  const exportToCSV = () => {
    const headers = ['Nome', 'WhatsApp', 'Empresa', 'Oferta', 'Cidade', 'Tags', 'Data', 'Válido'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.phone_whatsapp,
      lead.company_name || '',
      lead.offer_title || '',
      lead.city || '',
      lead.offer_tags?.join('; ') || '',
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      lead.is_valid ? 'Sim' : 'Não'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.totalLeads}</p>
            <p className="text-xs text-muted-foreground">Total de Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.validLeads}</p>
            <p className="text-xs text-muted-foreground">Leads Válidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.weeklyLeads}</p>
            <p className="text-xs text-muted-foreground">Última Semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.monthlyLeads}</p>
            <p className="text-xs text-muted-foreground">Último Mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Top 5 Empresas por Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByCompany} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Leads por Cidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsByCity}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {leadsByCity.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="default" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, empresa ou oferta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Company Filter */}
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Filter */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Cidades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Nicho/Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Nichos</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Valid Filter */}
            <Select value={validFilter} onValueChange={(v) => setValidFilter(v as typeof validFilter)}>
              <SelectTrigger>
                <CheckCircle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valid">Válidos</SelectItem>
                <SelectItem value="invalid">Inválidos</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Data Inicial</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Data Final</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Leads ({filteredLeads.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Oferta</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : pagination.paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  pagination.paginatedItems.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/${lead.phone_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone_whatsapp}
                        </a>
                      </TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell className="max-w-32 truncate" title={lead.offer_title}>
                        {lead.offer_title}
                      </TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.offer_tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                          {(lead.offer_tags?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{(lead.offer_tags?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(lead.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lead.is_valid ? 'default' : 'destructive'}>
                          {lead.is_valid ? 'Válido' : 'Inválido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <AdminPagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
