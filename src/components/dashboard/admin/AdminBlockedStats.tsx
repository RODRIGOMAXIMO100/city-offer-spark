import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Globe, Server, Shield, AlertTriangle, Ban, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface BlockedStats {
  byCountry: { ip_country: string; count: number }[];
  byASN: { ip_org: string; count: number }[];
  totalBlocked: number;
  totalVPN: number;
  totalProxy: number;
  totalGeoMismatch: number;
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
      // Fetch all clicks with flags for analysis
      const { data: allClicks } = await supabase
        .from('offer_clicks')
        .select('is_vpn, is_proxy, geo_mismatch, ip_country, ip_org, click_type');

      // Count based on boolean flags
      let totalVPN = 0;
      let totalProxy = 0;
      let totalGeoMismatch = 0;
      let totalDuplicate = 0;
      const countryCount: Record<string, number> = {};
      const orgCount: Record<string, number> = {};

      allClicks?.forEach(click => {
        if (click.is_vpn) totalVPN++;
        if (click.is_proxy) totalProxy++;
        if (click.geo_mismatch) totalGeoMismatch++;
        if (click.click_type === 'DUPLICATE') totalDuplicate++;

        // Count suspicious clicks by country (VPN, proxy, or geo_mismatch)
        if ((click.is_vpn || click.is_proxy || click.geo_mismatch) && click.ip_country) {
          countryCount[click.ip_country] = (countryCount[click.ip_country] || 0) + 1;
        }

        // Count VPN/proxy clicks by ASN
        if ((click.is_vpn || click.is_proxy) && click.ip_org) {
          orgCount[click.ip_org] = (orgCount[click.ip_org] || 0) + 1;
        }
      });

      const totalBlocked = totalVPN + totalProxy + totalGeoMismatch + totalDuplicate;

      // Fetch recent suspicious clicks
      const { data: recent } = await supabase
        .from('offer_clicks')
        .select('id, client_ip, ip_country, ip_org, click_type, is_vpn, is_proxy, geo_mismatch, created_at')
        .or('is_vpn.eq.true,is_proxy.eq.true,geo_mismatch.eq.true,click_type.eq.DUPLICATE')
        .order('created_at', { ascending: false })
        .limit(30);

      setStats({
        byCountry: Object.entries(countryCount)
          .map(([ip_country, count]) => ({ ip_country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        byASN: Object.entries(orgCount)
          .map(([ip_org, count]) => ({ ip_org, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        totalBlocked,
        totalVPN,
        totalProxy,
        totalGeoMismatch,
        totalDuplicate,
      });

      setRecentBlocked(recent || []);
    } catch (error) {
      console.error('Error fetching blocked stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const getClickBadges = (click: any) => {
    const badges = [];
    if (click.is_vpn) badges.push(<Badge key="vpn" variant="destructive" className="text-xs">VPN</Badge>);
    if (click.is_proxy) badges.push(<Badge key="proxy" className="bg-purple-500 text-xs">Proxy</Badge>);
    if (click.geo_mismatch) badges.push(<Badge key="geo" className="bg-orange-500 text-xs">Geo</Badge>);
    if (click.click_type === 'DUPLICATE') badges.push(<Badge key="dup" variant="secondary" className="text-xs">Duplicado</Badge>);
    return badges.length > 0 ? badges : <Badge variant="outline" className="text-xs">-</Badge>;
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{stats?.totalBlocked || 0}</p>
            <p className="text-xs text-muted-foreground">Total Suspeitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{stats?.totalVPN || 0}</p>
            <p className="text-xs text-muted-foreground">VPN Detectado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats?.totalProxy || 0}</p>
            <p className="text-xs text-muted-foreground">Proxy Detectado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{stats?.totalGeoMismatch || 0}</p>
            <p className="text-xs text-muted-foreground">Geo Mismatch</p>
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
              Cliques Suspeitos por País
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
                Nenhum clique suspeito registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* By ASN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Top ASNs com VPN/Proxy
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
                Nenhum ASN com VPN/Proxy ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Suspicious Clicks */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cliques Suspeitos Recentes
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
                    <TableHead>Flags</TableHead>
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
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">{getClickBadges(click)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum clique suspeito registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
