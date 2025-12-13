import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Download } from 'lucide-react';

interface AdminFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  cities: string[];
  onExport?: () => void;
  showRoleFilter?: boolean;
  showStatusFilter?: boolean;
  placeholder?: string;
}

export default function AdminFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  cityFilter,
  onCityFilterChange,
  statusFilter,
  onStatusFilterChange,
  cities,
  onExport,
  showRoleFilter = true,
  showStatusFilter = false,
  placeholder = 'Buscar por nome, email...'
}: AdminFiltersProps) {
  const clearFilters = () => {
    onSearchChange('');
    onRoleFilterChange('all');
    onCityFilterChange('all');
    onStatusFilterChange('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {showRoleFilter && (
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="COMPANY">Empresas</SelectItem>
            <SelectItem value="AFFILIATE">Divulgadores</SelectItem>
            <SelectItem value="CLIENT">Clientes</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Select value={cityFilter} onValueChange={onCityFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas cidades</SelectItem>
          {cities.map(city => (
            <SelectItem key={city} value={city}>{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showStatusFilter && (
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
          <X className="h-4 w-4" />
        </Button>
      )}

      {onExport && (
        <Button variant="outline" size="icon" onClick={onExport} title="Exportar CSV">
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
