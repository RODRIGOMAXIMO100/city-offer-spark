import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Phone, 
  Building2, 
  UserCheck, 
  CreditCard, 
  Banknote 
} from 'lucide-react';
import { formatBalance } from '@/types/database';
import { cn } from '@/lib/utils';

interface Stats {
  receita: number;
  custos: number;
  margem: number;
  margemPercent: number;
  leads: number;
  conversao: number;
  empresasAtivas: number;
  divulgadoresAtivos: number;
  totalEmpresas: number;
  totalDivulgadores: number;
  depositos: number;
  saquesPendentes: number;
  saldoEmpresas: number;
  saldoAfiliados: number;
}

interface AdminStatsCardsProps {
  stats: Stats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="space-y-4">
      {/* Financeiro */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" />
          Financeiro
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Receita</p>
                  <p className="text-lg font-bold text-green-600">{formatBalance(stats.receita)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Custos</p>
                  <p className="text-lg font-bold text-red-600">{formatBalance(stats.custos)}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-red-500/20 rotate-180" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Margem</p>
                  <p className={cn("text-lg font-bold", stats.margem >= 0 ? "text-blue-600" : "text-red-600")}>
                    {formatBalance(stats.margem)}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Margem %</p>
                  <p className={cn("text-lg font-bold", stats.margemPercent >= 30 ? "text-green-600" : stats.margemPercent >= 0 ? "text-yellow-600" : "text-red-600")}>
                    {stats.margemPercent.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Volume e Atividade */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" />
          Volume e Atividade
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Leads</p>
                  <p className="text-lg font-bold">{stats.leads}</p>
                </div>
                <Phone className="h-6 w-6 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Conversão</p>
                  <p className="text-lg font-bold">{stats.conversao.toFixed(2)}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Empresas</p>
                  <p className="text-lg font-bold text-company">
                    {stats.empresasAtivas}<span className="text-xs text-muted-foreground font-normal">/{stats.totalEmpresas}</span>
                  </p>
                </div>
                <Building2 className="h-6 w-6 text-company/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Divulgadores</p>
                  <p className="text-lg font-bold text-affiliate">
                    {stats.divulgadoresAtivos}<span className="text-xs text-muted-foreground font-normal">/{stats.totalDivulgadores}</span>
                  </p>
                </div>
                <UserCheck className="h-6 w-6 text-affiliate/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fluxo de Caixa */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Banknote className="h-3.5 w-3.5" />
          Fluxo de Caixa
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Depósitos</p>
                  <p className="text-lg font-bold text-green-600">{formatBalance(stats.depositos)}</p>
                </div>
                <CreditCard className="h-6 w-6 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow border border-orange-200 dark:border-orange-900/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">⚠️ Saques Pend.</p>
                  <p className="text-lg font-bold text-orange-600">{formatBalance(stats.saquesPendentes)}</p>
                </div>
                <Banknote className="h-6 w-6 text-orange-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Saldo Empresas</p>
                  <p className="text-lg font-bold">{formatBalance(stats.saldoEmpresas)}</p>
                </div>
                <Building2 className="h-6 w-6 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Saldo Afiliados</p>
                  <p className="text-lg font-bold">{formatBalance(stats.saldoAfiliados)}</p>
                </div>
                <UserCheck className="h-6 w-6 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
