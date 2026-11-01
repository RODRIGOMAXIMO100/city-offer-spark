import { useState } from 'react';
import { useNoIndex } from '@/components/seo/NoIndex';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Verify if user has ADMIN role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'ADMIN')
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          // Not an admin - sign out and show error
          await supabase.auth.signOut();
          toast({
            title: 'Acesso negado',
            description: 'Você não tem permissão para acessar o painel administrativo.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Bem-vindo, Admin!',
          description: 'Login realizado com sucesso.',
        });
        navigate('/admin');
      }
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useNoIndex();
  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-company/10 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-company" />
          </div>
          <CardTitle className="text-2xl font-display font-bold text-foreground">Painel Administrativo</CardTitle>
          <CardDescription>
            Acesso restrito a administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                required
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
               
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
