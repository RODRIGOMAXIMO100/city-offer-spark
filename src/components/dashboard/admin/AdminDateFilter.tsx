import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface AdminDateFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function AdminDateFilter({ dateRange, onDateRangeChange }: AdminDateFilterProps) {
  const setPreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        onDateRangeChange({ from: startOfToday, to: now });
        break;
      case '7d':
        onDateRangeChange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        onDateRangeChange({ from: subDays(now, 30), to: now });
        break;
      case 'thisMonth':
        onDateRangeChange({ from: startOfMonth(now), to: now });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        onDateRangeChange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'all':
        onDateRangeChange({ from: new Date('2020-01-01'), to: now });
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Período:</span>
      <div className="flex gap-1 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setPreset('today')}>Hoje</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset('7d')}>7d</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset('30d')}>30d</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset('thisMonth')}>Mês</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset('all')}>Geral</Button>
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
              )
            ) : (
              'Período'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
