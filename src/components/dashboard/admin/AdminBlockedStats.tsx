import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Globe, Server, Shield, AlertTriangle, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface BlockedStats {
  byClickType: { click_type: string; count: number }[];
  byCountry: { ip_country: string; count: number }[];
  byASN: { ip_org: string; count: number }[];
  totalBlocked: number;
  totalVPN: number;
  totalGeoBlocked: number;
  totalDuplicate: number;
}

export default function AdminBlockedStats() {
  const [stats, setStats] = useState<BlockedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentBlocked, setRecentBlocked] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch blocked clicks by type
      const { data: byType } = await supabase
        .from('offer_clicks')
        .select('click_type')
        .in('click_type', ['VPN_BLOCKED', 'GEO_BLOCKED', 'DUPLICATE']);
      
      const clickTypeCount = byType?.reduce((acc, { click_type }) => {
        acc[click_type] = (acc[click_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch by country
      const { data: byCountry } = await supabase
        .from('offer_clicks')
        .select('ip_country')
        .in('click_type', ['VPN_BLOCKED', 'GEO_BLOCKED'])
        .not('ip_country', 'is', null);
      
      const countryCount = byCountry?.reduce((acc, { ip_country }) => {
        if (ip_country) {
          acc[ip_country] = (acc[ip_country] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch by ASN/Org
      const { data: byOrg } = await supabase
        .from('offer_clicks')
        .select('ip_org')
        .eq('click_type', 'VPN_BLOCKED')
        .not('ip_org', 'is', null);
      
      const orgCount = byOrg?.reduce((acc, { ip_org }) => {
        if (ip_org) {
          acc[ip_org] = (acc[ip_org] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch recent blocked clicks
      const { data: recent } = await supabase
        .from('offer_clicks')
        .select('id, client_ip, ip_country, ip_org, click_type, created_at')
        .in('click_type', ['VPN_BLOCKED', 'GEO_BLOCKED'])
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        byClickType: Object.entries(clickTypeCount).map(([click_type, count]) => ({ click_type, count })),
        byCountry: Object.entries(countryCount)
          .map(([ip_country, count]) => ({ ip_country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        byASN: Object.entries(orgCount)
          .map(([ip_org, count]) => ({ ip_org, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        totalBlocked: Object.values(clickTypeCount).reduce((a, b) => a + b, 0),
        totalVPN: clickTypeCount['VPN_BLOCKED'] || 0,
        totalGeoBlocked: clickTypeCount['GEO_BLOCKED'] || 0,
        totalDuplicate: clickTypeCount['DUPLICATE'] || 0,
      });

      setRecentBlocked(recent || []);
    } catch (error) {
      console.error('Error fetching blocked stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const getClickTypeBadge = (type: string) => {
    switch (type) {
      case 'VPN_BLOCKED':
        return <Badge variant="destructive">VPN/Hosting</Badge>;
      case 'GEO_BLOCKED':
        return <Badge className="bg-orange-500">Geo Bloqueado</Badge>;
      case 'DUPLICATE':
        return <Badge variant="secondary">Duplicado</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCountryFlag = (code: string) => {
    if (!code || code.length !== 2) return '🌍';
    const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{stats?.totalBlocked || 0}</p>
            <p className="text-xs text-muted-foreground">Total Bloqueados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats?.totalVPN || 0}</p>
            <p className="text-xs text-muted-foreground">VPN/Hosting</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats?.totalGeoBlocked || 0}</p>
            <p className="text-xs text-muted-foreground">Fora do Brasil</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats?.totalDuplicate || 0}</p>
            <p className="text-xs text-muted-foreground">Duplicados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Country */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Bloqueados por País
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byCountry && stats.byCountry.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.byCountry.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(item.ip_country)}</span>
                      <span className="text-sm font-medium">{item.ip_country}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum bloqueio por país registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* By ASN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Top ASNs Bloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.byASN && stats.byASN.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.byASN.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <span className="text-xs font-mono truncate max-w-[200px]" title={item.ip_org}>
                      {item.ip_org}
                    </span>
                    <Badge variant="destructive">{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ASN bloqueado ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Blocked Clicks */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cliques Bloqueados Recentes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {recentBlocked.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>ASN/Org</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBlocked.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell className="text-xs">
                        {new Date(click.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{click.client_ip}</TableCell>
                      <TableCell>
                        <span className="mr-1">{getCountryFlag(click.ip_country)}</span>
                        {click.ip_country || '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate" title={click.ip_org}>
                        {click.ip_org || '-'}
                      </TableCell>
                      <TableCell>{getClickTypeBadge(click.click_type)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum clique bloqueado registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
