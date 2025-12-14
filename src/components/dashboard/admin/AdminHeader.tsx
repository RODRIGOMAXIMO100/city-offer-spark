import { Button } from '@/components/ui/button';
import { Shield, RefreshCw, LogOut, Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import AdminAlerts from './AdminAlerts';

interface AdminHeaderProps {
  profileName?: string;
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}

export function AdminHeader({ profileName, loading, onRefresh, onSignOut }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="shrink-0">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <Shield className="h-6 w-6 text-destructive shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">Painel Admin</h1>
              <p className="text-xs text-muted-foreground truncate">{profileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <AdminAlerts />
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="hidden sm:flex">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="sm:hidden">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="hidden sm:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <Button variant="ghost" size="icon" onClick={onSignOut} className="sm:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
