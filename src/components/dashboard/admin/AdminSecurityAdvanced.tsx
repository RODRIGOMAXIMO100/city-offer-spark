import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Shield, 
  Fingerprint, 
  AlertTriangle, 
  Ban, 
  Check, 
  Smartphone,
  Globe,
  UserX
} from 'lucide-react';
import AdminPagination, { usePagination } from './AdminPagination';

interface RateLimitData {
  id: string;
  ip_address: string;
  click_count: number;
  blocked: boolean;
  first_click_at: string;
  last_click_at: string;
}

interface FingerprintData {
  id: string;
  device_id: string;
  ip_address: string;
  is_suspicious: boolean;
  blocked: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

interface SuspiciousAffiliate {
  id: string;
  name: string;
  total_clicks: number;
  duplicate_clicks: number;
  duplicate_rate: number;
  unique_ips: number;
}

export default function AdminSecurityAdvanced() {
  const [rateLimits, setRateLimits] = useState<RateLimitData[]>([]);
  const [fingerprints, setFingerprints] = useState<FingerprintData[]>([]);
  const [suspiciousAffiliates, setSuspiciousAffiliates] = useState<SuspiciousAffiliate[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    blockedIPs: 0,
    suspiciousDevices: 0,
    suspiciousAffiliates: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRateLimits(),
      fetchFingerprints(),
      fetchSuspiciousAffiliates()
    ]);
    setLoading(false);
  };

  const fetchRateLimits = async () => {
    try {
      const { data } = await supabase
        .from('click_rate_limits')
        .select('*')
        .order('last_click_at', { ascending: false })
        .limit(100);
      
      setRateLimits(data || []);
      setStats(prev => ({ 
        ...prev, 
        blockedIPs: data?.filter(r => r.blocked).length || 0 
      }));
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    }
  };

  const fetchFingerprints = async () => {
    try {
      const { data } = await supabase
        .from('device_fingerprints')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(100);
      
      setFingerprints(data || []);
      setStats(prev => ({ 
        ...prev, 
        suspiciousDevices: data?.filter(f => f.is_suspicious || f.blocked).length || 0 
      }));
    } catch (error) {
      console.error('Error fetching fingerprints:', error);
    }
  };

  const fetchSuspiciousAffiliates = async () => {
    try {
      // Get all clicks with affiliate info
      const { data: clicks } = await supabase
        .from('offer_clicks')
        .select('affiliate_id, click_type, client_ip')
        .not('affiliate_id', 'is', null);

      if (!clicks || clicks.length === 0) {
        setSuspiciousAffiliates([]);
        return;
      }

      // Group by affiliate
      const affiliateStats: Record<string, {
        total: number;
        duplicates: number;
        ips: Set<string>;
      }> = {};

      clicks.forEach(click => {
        if (!click.affiliate_id) return;
        
        if (!affiliateStats[click.affiliate_id]) {
          affiliateStats[click.affiliate_id] = { total: 0, duplicates: 0, ips: new Set() };
        }
        
        affiliateStats[click.affiliate_id].total++;
        if (click.click_type === 'DUPLICATE') {
          affiliateStats[click.affiliate_id].duplicates++;
        }
        if (click.client_ip) {
          affiliateStats[click.affiliate_id].ips.add(click.client_ip);
        }
      });

      // Filter suspicious (>20% duplicates or <3 unique IPs with >10 clicks)
      const suspiciousIds = Object.entries(affiliateStats)
        .filter(([_, stats]) => {
          const duplicateRate = stats.duplicates / stats.total;
          const fewIPs = stats.ips.size < 3 && stats.total > 10;
          return duplicateRate > 0.2 || fewIPs;
        })
        .map(([id]) => id);

      if (suspiciousIds.length === 0) {
        setSuspiciousAffiliates([]);
        setStats(prev => ({ ...prev, suspiciousAffiliates: 0 }));
        return;
      }

      // Get affiliate names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', suspiciousIds);

      const suspicious: SuspiciousAffiliate[] = suspiciousIds.map(id => {
        const stats = affiliateStats[id];
        const profile = profiles?.find(p => p.id === id);
        return {
          id,
          name: profile?.name || 'Desconhecido',
          total_clicks: stats.total,
          duplicate_clicks: stats.duplicates,
          duplicate_rate: (stats.duplicates / stats.total) * 100,
          unique_ips: stats.ips.size
        };
      }).sort((a, b) => b.duplicate_rate - a.duplicate_rate);

      setSuspiciousAffiliates(suspicious);
      setStats(prev => ({ ...prev, suspiciousAffiliates: suspicious.length }));
    } catch (error) {
      console.error('Error fetching suspicious affiliates:', error);
    }
  };

  const handleBlockIP = async (id: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('click_rate_limits')
        .update({ blocked: !blocked })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(blocked ? 'IP desbloqueado' : 'IP bloqueado');
      fetchRateLimits();
    } catch (error) {
      toast.error('Erro ao atualizar bloqueio');
    }
  };

  const handleBlockDevice = async (id: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .update({ blocked: !blocked })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(blocked ? 'Dispositivo desbloqueado' : 'Dispositivo bloqueado');
      fetchFingerprints();
    } catch (error) {
      toast.error('Erro ao atualizar bloqueio');
    }
  };

  // Pagination
  const rateLimitsPagination = usePagination(rateLimits, 10);
  const fingerprintsPagination = usePagination(fingerprints, 10);
  const affiliatesPagination = usePagination(suspiciousAffiliates, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <Ban className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.blockedIPs}</p>
              <p className="text-sm text-muted-foreground">IPs Bloqueados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/10">
              <Smartphone className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspiciousDevices}</p>
              <p className="text-sm text-muted-foreground">Dispositivos Suspeitos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <UserX className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suspiciousAffiliates}</p>
              <p className="text-sm text-muted-foreground">Afiliados Suspeitos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rate-limits">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rate-limits">
            <Globe className="h-4 w-4 mr-2" />
            Rate Limits ({rateLimits.length})
          </TabsTrigger>
          <TabsTrigger value="fingerprints">
            <Fingerprint className="h-4 w-4 mr-2" />
            Fingerprints ({fingerprints.length})
          </TabsTrigger>
          <TabsTrigger value="suspicious">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Afiliados ({suspiciousAffiliates.length})
          </TabsTrigger>
        </TabsList>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rate Limits por IP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primeiro Clique</TableHead>
                    <TableHead>Último Clique</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateLimitsPagination.paginatedItems.map((rl) => (
                    <TableRow key={rl.id}>
                      <TableCell className="font-mono text-sm">{rl.ip_address}</TableCell>
                      <TableCell>{rl.click_count}</TableCell>
                      <TableCell>
                        {rl.blocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="secondary">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rl.first_click_at ? new Date(rl.first_click_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rl.last_click_at ? new Date(rl.last_click_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={rl.blocked ? 'outline' : 'destructive'}
                          size="sm"
                          onClick={() => handleBlockIP(rl.id, rl.blocked)}
                        >
                          {rl.blocked ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={rateLimitsPagination.currentPage}
                totalPages={rateLimitsPagination.totalPages}
                onPageChange={rateLimitsPagination.setCurrentPage}
                totalItems={rateLimits.length}
                itemsPerPage={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fingerprints Tab */}
        <TabsContent value="fingerprints">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Device Fingerprints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fingerprints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum fingerprint registrado
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device ID</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Primeira Vez</TableHead>
                        <TableHead>Última Vez</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fingerprintsPagination.paginatedItems.map((fp) => (
                        <TableRow key={fp.id}>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate">
                            {fp.device_id}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{fp.ip_address}</TableCell>
                          <TableCell>
                            {fp.blocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : fp.is_suspicious ? (
                              <Badge className="bg-orange-500">Suspeito</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fp.first_seen_at ? new Date(fp.first_seen_at).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fp.last_seen_at ? new Date(fp.last_seen_at).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={fp.blocked ? 'outline' : 'destructive'}
                              size="sm"
                              onClick={() => handleBlockDevice(fp.id, fp.blocked)}
                            >
                              {fp.blocked ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AdminPagination
                    currentPage={fingerprintsPagination.currentPage}
                    totalPages={fingerprintsPagination.totalPages}
                    onPageChange={fingerprintsPagination.setCurrentPage}
                    totalItems={fingerprints.length}
                    itemsPerPage={10}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspicious Affiliates Tab */}
        <TabsContent value="suspicious">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Afiliados com Padrões Suspeitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suspiciousAffiliates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum afiliado suspeito detectado
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Total Cliques</TableHead>
                        <TableHead>Duplicados</TableHead>
                        <TableHead>Taxa Duplicados</TableHead>
                        <TableHead>IPs Únicos</TableHead>
                        <TableHead>Alerta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliatesPagination.paginatedItems.map((aff) => (
                        <TableRow key={aff.id}>
                          <TableCell className="font-medium">{aff.name}</TableCell>
                          <TableCell>{aff.total_clicks}</TableCell>
                          <TableCell>{aff.duplicate_clicks}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={aff.duplicate_rate > 30 ? 'destructive' : 'secondary'}
                            >
                              {aff.duplicate_rate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {aff.unique_ips < 3 ? (
                              <span className="text-orange-500 font-medium">{aff.unique_ips}</span>
                            ) : (
                              aff.unique_ips
                            )}
                          </TableCell>
                          <TableCell>
                            {aff.duplicate_rate > 30 ? (
                              <Badge variant="destructive">Alta duplicação</Badge>
                            ) : aff.unique_ips < 3 ? (
                              <Badge className="bg-orange-500">Poucos IPs</Badge>
                            ) : (
                              <Badge variant="secondary">Monitorar</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AdminPagination
                    currentPage={affiliatesPagination.currentPage}
                    totalPages={affiliatesPagination.totalPages}
                    onPageChange={affiliatesPagination.setCurrentPage}
                    totalItems={suspiciousAffiliates.length}
                    itemsPerPage={10}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}