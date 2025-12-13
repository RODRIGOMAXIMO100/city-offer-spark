import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Building2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Niche {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  active: boolean;
  created_at: string;
  company_count?: number;
}

interface CompanyWithNiche {
  id: string;
  name: string;
  niche_confidence: number | null;
  niche_last_updated: string | null;
}

const CATEGORIES = ['Alimentação', 'Beleza', 'Saúde', 'Serviços', 'Varejo', 'Outros'];

export function AdminNiches() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyWithNiche[]>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', icon: '' });
  const [reclassifying, setReclassifying] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    setLoading(true);
    try {
      // Fetch niches
      const { data: nichesData, error: nichesError } = await supabase
        .from('niches')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (nichesError) throw nichesError;

      // Fetch companies with their niches
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, niche_id, niche_confidence, niche_last_updated')
        .not('niche_id', 'is', null);

      if (profilesError) throw profilesError;

      // Count companies per niche
      const companyCounts: Record<string, number> = {};
      const companiesByNiche: Record<string, CompanyWithNiche[]> = {};

      profilesData?.forEach(profile => {
        if (profile.niche_id) {
          companyCounts[profile.niche_id] = (companyCounts[profile.niche_id] || 0) + 1;
          if (!companiesByNiche[profile.niche_id]) {
            companiesByNiche[profile.niche_id] = [];
          }
          companiesByNiche[profile.niche_id].push({
            id: profile.id,
            name: profile.name,
            niche_confidence: profile.niche_confidence,
            niche_last_updated: profile.niche_last_updated
          });
        }
      });

      const nichesWithCount = nichesData?.map(niche => ({
        ...niche,
        company_count: companyCounts[niche.id] || 0
      })) || [];

      setNiches(nichesWithCount);
      setCompanies(companiesByNiche);
    } catch (error) {
      console.error('Error fetching niches:', error);
      toast.error('Erro ao carregar nichos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNiche = async () => {
    try {
      if (editingNiche) {
        const { error } = await supabase
          .from('niches')
          .update({
            name: formData.name,
            category: formData.category,
            icon: formData.icon || null
          })
          .eq('id', editingNiche.id);

        if (error) throw error;
        toast.success('Nicho atualizado');
      } else {
        const { error } = await supabase
          .from('niches')
          .insert({
            name: formData.name,
            category: formData.category,
            icon: formData.icon || null
          });

        if (error) throw error;
        toast.success('Nicho criado');
      }

      setIsModalOpen(false);
      setEditingNiche(null);
      setFormData({ name: '', category: '', icon: '' });
      fetchNiches();
    } catch (error: any) {
      console.error('Error saving niche:', error);
      toast.error(error.message || 'Erro ao salvar nicho');
    }
  };

  const handleToggleActive = async (niche: Niche) => {
    try {
      const { error } = await supabase
        .from('niches')
        .update({ active: !niche.active })
        .eq('id', niche.id);

      if (error) throw error;
      
      setNiches(prev => prev.map(n => 
        n.id === niche.id ? { ...n, active: !n.active } : n
      ));
      toast.success(niche.active ? 'Nicho desativado' : 'Nicho ativado');
    } catch (error) {
      console.error('Error toggling niche:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleReclassifyCompany = async (companyId: string) => {
    setReclassifying(companyId);
    try {
      const { error } = await supabase.functions.invoke('classify-company-niche', {
        body: { company_id: companyId }
      });

      if (error) throw error;
      
      toast.success('Empresa reclassificada');
      fetchNiches();
    } catch (error) {
      console.error('Error reclassifying:', error);
      toast.error('Erro ao reclassificar');
    } finally {
      setReclassifying(null);
    }
  };

  const openEditModal = (niche: Niche) => {
    setEditingNiche(niche);
    setFormData({ name: niche.name, category: niche.category, icon: niche.icon || '' });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingNiche(null);
    setFormData({ name: '', category: '', icon: '' });
    setIsModalOpen(true);
  };

  const filteredNiches = selectedCategory === 'all' 
    ? niches 
    : niches.filter(n => n.category === selectedCategory);

  const totalCompanies = niches.reduce((sum, n) => sum + (n.company_count || 0), 0);
  const lowConfidenceCount = Object.values(companies).flat()
    .filter(c => c.niche_confidence !== null && c.niche_confidence < 0.7).length;

  if (loading) {
    return <div className="flex justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{niches.length}</div>
            <p className="text-sm text-muted-foreground">Nichos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{niches.filter(n => n.active).length}</div>
            <p className="text-sm text-muted-foreground">Nichos ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-sm text-muted-foreground">Empresas classificadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{lowConfidenceCount}</div>
            <p className="text-sm text-muted-foreground">Baixa confiança (&lt;70%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Nicho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNiche ? 'Editar Nicho' : 'Novo Nicho'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pizzaria"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ícone (emoji)</Label>
                <Input 
                  value={formData.icon} 
                  onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Ex: 🍕"
                />
              </div>
              <Button 
                onClick={handleSaveNiche} 
                className="w-full"
                disabled={!formData.name || !formData.category}
              >
                {editingNiche ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Niches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nichos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nicho</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Empresas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNiches.map(niche => (
                <TableRow key={niche.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{niche.icon}</span>
                      <span className="font-medium">{niche.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{niche.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{niche.company_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={niche.active} 
                      onCheckedChange={() => handleToggleActive(niche)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(niche)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Confidence Companies */}
      {lowConfidenceCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Empresas com baixa confiança de classificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Nicho Atual</TableHead>
                  <TableHead className="text-center">Confiança</TableHead>
                  <TableHead>Última Classificação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(companies).flatMap(([nicheId, comps]) =>
                  comps
                    .filter(c => c.niche_confidence !== null && c.niche_confidence < 0.7)
                    .map(company => {
                      const niche = niches.find(n => n.id === nicheId);
                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{niche?.icon}</span>
                              <span>{niche?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={company.niche_confidence! < 0.5 ? 'destructive' : 'secondary'}>
                              {Math.round((company.niche_confidence || 0) * 100)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {company.niche_last_updated 
                              ? new Date(company.niche_last_updated).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReclassifyCompany(company.id)}
                              disabled={reclassifying === company.id}
                            >
                              {reclassifying === company.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              <span className="ml-2">Reclassificar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
