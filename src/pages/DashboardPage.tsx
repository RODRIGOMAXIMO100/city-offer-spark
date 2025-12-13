import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

export default function DashboardPage() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Usuário autenticado mas sem role = novo usuário Google que precisa completar cadastro
    if (!loading && user && !role) {
      navigate('/complete-signup');
    }
  }, [loading, user, role, navigate]);

  if (loading) {
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