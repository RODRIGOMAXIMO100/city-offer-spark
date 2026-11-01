import { useEffect, useState, useRef } from 'react';
import { useNoIndex } from '@/components/seo/NoIndex';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogOut, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { whatsappLink } from '@/lib/contact';
import CompanyDashboard from '@/components/dashboard/CompanyDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

export default function DashboardPage() {
  const { role, loading, user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRefreshed = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useNoIndex();


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
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    default:
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="text-center max-w-sm space-y-4">
            <p className="text-muted-foreground">Não encontramos o tipo da sua conta. Saia e entre de novo. Se continuar, fale com a gente.</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  await signOut();
                  navigate('/auth', { replace: true });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da conta
              </Button>
              <Button variant="outline" asChild>
                <a href={whatsappLink(`Oi! Minha conta no Clilin (${user.email ?? ''}) não abre o painel.`)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
  }
}
