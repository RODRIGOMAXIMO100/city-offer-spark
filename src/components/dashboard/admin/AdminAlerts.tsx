import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, AlertTriangle, Smartphone, DollarSign } from 'lucide-react';

interface Alert {
  id: string;
  type: 'withdrawal' | 'device' | 'affiliate';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const newAlerts: Alert[] = [];
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Check high fraud score withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, fraud_score, nome_completo, requested_at')
        .eq('status', 'PENDING')
        .gt('fraud_score', 50);

      withdrawals?.forEach(w => {
        newAlerts.push({
          id: `withdrawal-${w.id}`,
          type: 'withdrawal',
          title: 'Saque Suspeito',
          description: `${w.nome_completo} - Score: ${w.fraud_score}`,
          severity: w.fraud_score && w.fraud_score > 70 ? 'high' : 'medium',
          timestamp: new Date(w.requested_at || '')
        });
      });

      // 2. Check suspicious devices (last 24h)
      const { data: devices } = await supabase
        .from('device_fingerprints')
        .select('id, device_id, ip_address, last_seen_at')
        .eq('is_suspicious', true)
        .eq('blocked', false)
        .gte('last_seen_at', last24h.toISOString());

      devices?.forEach(d => {
        newAlerts.push({
          id: `device-${d.id}`,
          type: 'device',
          title: 'Dispositivo Suspeito',
          description: `IP: ${d.ip_address}`,
          severity: 'medium',
          timestamp: new Date(d.last_seen_at || '')
        });
      });

      // 3. Check high duplicate rate affiliates
      const { data: clicks } = await supabase
        .from('offer_clicks')
        .select('affiliate_id, click_type')
        .not('affiliate_id', 'is', null)
        .gte('created_at', last24h.toISOString());

      if (clicks && clicks.length > 0) {
        const affiliateStats: Record<string, { total: number; duplicates: number }> = {};
        
        clicks.forEach(click => {
          if (!click.affiliate_id) return;
          if (!affiliateStats[click.affiliate_id]) {
            affiliateStats[click.affiliate_id] = { total: 0, duplicates: 0 };
          }
          affiliateStats[click.affiliate_id].total++;
          if (click.click_type === 'DUPLICATE') {
            affiliateStats[click.affiliate_id].duplicates++;
          }
        });

        const suspiciousAffiliateIds = Object.entries(affiliateStats)
          .filter(([_, stats]) => stats.total >= 10 && (stats.duplicates / stats.total) > 0.3)
          .map(([id]) => id);

        if (suspiciousAffiliateIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', suspiciousAffiliateIds);

          profiles?.forEach(p => {
            const stats = affiliateStats[p.id];
            const rate = Math.round((stats.duplicates / stats.total) * 100);
            newAlerts.push({
              id: `affiliate-${p.id}`,
              type: 'affiliate',
              title: 'Afiliado Alto Duplicado',
              description: `${p.name} - ${rate}% duplicados`,
              severity: rate > 50 ? 'high' : 'medium',
              timestamp: now
            });
          });
        }
      }

      // Sort by severity and timestamp
      newAlerts.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
    setLoading(false);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'withdrawal':
        return <DollarSign className="h-4 w-4" />;
      case 'device':
        return <Smartphone className="h-4 w-4" />;
      case 'affiliate':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className={`h-5 w-5 ${alerts.length > 0 ? 'text-orange-500' : ''}`} />
          {alerts.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {alerts.length > 9 ? '9+' : alerts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alertas</span>
          {alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length} pendentes</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhum alerta pendente
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {alerts.slice(0, 10).map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex items-start gap-3 p-3 cursor-default">
                <div className={`mt-0.5 ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                </div>
                <Badge 
                  variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs shrink-0"
                >
                  {alert.severity === 'high' ? 'Alto' : 'Médio'}
                </Badge>
              </DropdownMenuItem>
            ))}
            {alerts.length > 10 && (
              <div className="p-2 text-center text-xs text-muted-foreground border-t">
                +{alerts.length - 10} alertas adicionais
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}