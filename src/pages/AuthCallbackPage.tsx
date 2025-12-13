import { useEffect, useState } from 'react';
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
        // Get session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Erro ao processar autenticação');
          navigate('/auth');
          return;
        }

        if (!session?.user) {
          navigate('/auth');
          return;
        }

        setStatus('Verificando perfil...');

        // Check if user has a profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
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
      } catch (error) {
        console.error('Callback error:', error);
        toast.error('Erro inesperado na autenticação');
        navigate('/auth');
      }
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
