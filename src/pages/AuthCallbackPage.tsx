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

        // New user - create profile with COMPANY role (Google login is only for companies)
        setStatus('Criando perfil...');
        
        const userName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.email?.split('@')[0] || 
                        'Usuário';

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            name: userName,
            city: '',
            balance: 100, // Bônus inicial para empresas
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Erro ao criar perfil');
          navigate('/auth');
          return;
        }

        // Create COMPANY role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: session.user.id,
            role: 'COMPANY',
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
          toast.error('Erro ao definir perfil de empresa');
          navigate('/auth');
          return;
        }

        toast.success('Conta criada com sucesso! Bem-vindo!');
        navigate('/dashboard');
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
