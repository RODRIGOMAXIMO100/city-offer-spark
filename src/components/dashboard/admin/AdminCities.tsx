import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAllCitiesAdmin } from '@/hooks/useAvailableCities';
import { BRAZIL_STATES } from '@/data/brazilLocations';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MapPin, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  Clock, 
  Loader2,
  Database,
  ToggleLeft,
  ToggleRight,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
}

export default function AdminCities() {
  const { cities, stats, loading, toggleCity, updateSchedule, bulkToggleState, seedCities, refetch } = useAllCitiesAdmin();
  const { toast } = useToast();
  
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedCityWaitlist, setSelectedCityWaitlist] = useState<{ id: string; name: string } | null>(null);
  const [waitlistData, setWaitlistData] = useState<WaitlistEntry[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const states = BRAZIL_STATES.map(s => s.code).sort();

  const filteredCities = useMemo(() => {
    let result = cities;
    
    if (selectedState !== 'all') {
      result = result.filter(c => c.state_code === selectedState);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.city_name.toLowerCase().includes(term) ||
        c.state_code.toLowerCase().includes(term)
      );
    }
    
    if (showOnlyActive) {
      result = result.filter(c => c.active);
    }
    
    return result;
  }, [cities, selectedState, searchTerm, showOnlyActive]);

  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCities.slice(start, start + itemsPerPage);
  }, [filteredCities, currentPage]);

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);

  const stateStats = useMemo(() => {
    if (selectedState === 'all') return null;
    const stateCities = cities.filter(c => c.state_code === selectedState);
    return {
      total: stateCities.length,
      active: stateCities.filter(c => c.active).length,
      waitlist: stateCities.reduce((sum, c) => sum + (c.waitlist_count || 0), 0)
    };
  }, [cities, selectedState]);

  const handleSeedCities = async () => {
    try {
      setSeeding(true);
      await seedCities();
      toast({
        title: "Cidades importadas! 💛",
        description: "Todas as cidades foram adicionadas ao banco de dados."
      });
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: "Não foi possível importar as cidades.",
        variant: "destructive"
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleCity = async (cityId: string, currentActive: boolean) => {
    try {
      await toggleCity(cityId, !currentActive);
      toast({
        title: currentActive ? "Cidade desativada" : "Cidade ativada! 💛",
        description: currentActive 
          ? "A cidade não está mais disponível para cadastro."
          : "A cidade agora está disponível para novos cadastros!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da cidade.",
        variant: "destructive"
      });
    }
  };

  const handleBulkToggle = async (active: boolean) => {
    if (selectedState === 'all') return;
    
    try {
      await bulkToggleState(selectedState, active);
      toast({
        title: active ? "Estado ativado! 💛" : "Estado desativado",
        description: active 
          ? `Todas as cidades de ${selectedState} estão disponíveis!`
          : `Todas as cidades de ${selectedState} foram desativadas.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status das cidades.",
        variant: "destructive"
      });
    }
  };

  const handleSchedule = async (cityId: string, date: Date | undefined) => {
    try {
      await updateSchedule(cityId, date ? date.toISOString() : null);
      toast({
        title: date ? "Agendamento salvo! 💛" : "Agendamento removido",
        description: date 
          ? `A cidade será ativada em ${format(date, "dd/MM/yyyy", { locale: ptBR })}`
          : "O agendamento foi removido."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível agendar a ativação.",
        variant: "destructive"
      });
    }
  };

  const loadWaitlist = async (cityId: string, cityName: string) => {
    setSelectedCityWaitlist({ id: cityId, name: cityName });
    setLoadingWaitlist(true);
    
    try {
      const { data, error } = await supabase
        .from('city_waitlist')
        .select('*')
        .eq('city_id', cityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWaitlistData(data || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
      setWaitlistData([]);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  if (loading && cities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Cidades</p>
                <p className="text-2xl font-bold">{stats.totalCities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cidades Ativas</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeCities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold text-blue-500">{stats.scheduledCities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lista de Espera</p>
                <p className="text-2xl font-bold text-amber-500">{stats.totalWaitlist}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão para popular banco se vazio */}
      {cities.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma cidade cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Importe todas as cidades do Brasil para começar a gerenciar a expansão.
            </p>
            <Button onClick={handleSeedCities} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Importar Cidades do Brasil
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      {cities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gerenciar Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cidade..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={showOnlyActive}
                  onCheckedChange={setShowOnlyActive}
                  id="show-active"
                />
                <label htmlFor="show-active" className="text-sm">
                  Apenas ativas
                </label>
              </div>
            </div>

            {/* Bulk actions para estado selecionado */}
            {selectedState !== 'all' && stateStats && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{selectedState}</p>
                  <p className="text-sm text-muted-foreground">
                    {stateStats.active} de {stateStats.total} cidades ativas • {stateStats.waitlist} na lista de espera
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(false)}
                  >
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Desativar Todas
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkToggle(true)}
                  >
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Ativar Todas
                  </Button>
                </div>
              </div>
            )}

            {/* Tabela de cidades */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Lista de Espera</TableHead>
                    <TableHead className="text-center">Agendamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCities.map(city => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.city_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{city.state_code}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={city.active}
                          onCheckedChange={() => handleToggleCity(city.id, city.active)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {city.waitlist_count > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadWaitlist(city.id, city.city_name)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            {city.waitlist_count}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {city.scheduled_activation ? (
                                <span className="text-blue-500">
                                  {format(new Date(city.scheduled_activation), "dd/MM/yy")}
                                </span>
                              ) : (
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                              mode="single"
                              selected={city.scheduled_activation ? new Date(city.scheduled_activation) : undefined}
                              onSelect={(date) => handleSchedule(city.id, date)}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                            {city.scheduled_activation && (
                              <div className="p-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => handleSchedule(city.id, undefined)}
                                >
                                  Remover agendamento
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={city.active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleCity(city.id, city.active)}
                        >
                          {city.active ? "Desativar" : "Ativar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCities.length)} de {filteredCities.length} cidades
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Lista de Espera */}
      <Dialog open={!!selectedCityWaitlist} onOpenChange={() => setSelectedCityWaitlist(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Espera - {selectedCityWaitlist?.name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingWaitlist ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : waitlistData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pessoa na lista de espera
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-auto">
              {waitlistData.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                    {entry.phone && (
                      <p className="text-sm text-muted-foreground">{entry.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      entry.role === 'COMPANY' ? 'default' :
                      entry.role === 'AFFILIATE' ? 'secondary' : 'outline'
                    }>
                      {entry.role === 'COMPANY' ? 'Empresa' :
                       entry.role === 'AFFILIATE' ? 'Divulgador' : 'Cliente'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
