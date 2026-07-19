import { useEffect, useState } from 'react';
import { useNoIndex } from '@/components/seo/NoIndex';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processando autenticação...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Aguardar um pouco para a sessão ser estabelecida pelo Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Erro ao processar autenticação');
          navigate('/auth');
          return;
        }

        if (!session?.user) {
          // Tentar novamente após um delay maior
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (!retrySession?.user) {
            navigate('/auth');
            return;
          }
          
          // Usar a sessão do retry
          await checkProfileAndRedirect(retrySession.user.id);
          return;
        }

        await checkProfileAndRedirect(session.user.id);
      } catch (error) {
        console.error('Callback error:', error);
        toast.error('Erro inesperado na autenticação');
        navigate('/auth');
      }
    };

    const checkProfileAndRedirect = async (userId: string) => {
      setStatus('Verificando perfil...');

      // Check if user has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProfile) {
        // User already has profile, go to dashboard
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
        return;
      }

      // New user - redirect to complete signup page to choose role
      setStatus('Redirecionando para completar cadastro...');
      navigate('/complete-signup');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
