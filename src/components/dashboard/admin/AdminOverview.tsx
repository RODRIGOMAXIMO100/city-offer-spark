import { AdminStatsCards } from './AdminStatsCards';
import { AdminDateFilter } from './AdminDateFilter';
import { DateRange } from 'react-day-picker';

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

interface AdminOverviewProps {
  stats: Stats;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function AdminOverview({ stats, dateRange, onDateRangeChange }: AdminOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Visão Geral</h2>
      </div>
      
      <AdminDateFilter 
        dateRange={dateRange} 
        onDateRangeChange={onDateRangeChange} 
      />
      
      <AdminStatsCards stats={stats} />
    </div>
  );
}
