import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

export default function DashboardPage() {
  const { role, loading, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRefreshed = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    // Se veio do complete-signup e não tem role, tenta refresh uma vez
    if (!loading && user && !role && !hasRefreshed.current) {
      hasRefreshed.current = true;
      setIsRefreshing(true);
      
      // Tenta atualizar o perfil para pegar o role recém-criado
      refreshProfile().finally(() => {
        setIsRefreshing(false);
      });
      return;
    }
    
    // Se depois do refresh ainda não tem role, redireciona
    if (!loading && !isRefreshing && user && !role && hasRefreshed.current) {
      navigate('/complete-signup');
    }
  }, [loading, user, role, navigate, refreshProfile, isRefreshing]);

  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  switch (role) {
    case 'COMPANY':
      return <CompanyDashboard />;
    case 'AFFILIATE':
      return <AffiliateDashboard />;
    case 'CLIENT':
      return <ClientDashboard />;
    default:
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Perfil não reconhecido. Por favor, faça login novamente.</p>
          </div>
        </div>
      );
  }
}