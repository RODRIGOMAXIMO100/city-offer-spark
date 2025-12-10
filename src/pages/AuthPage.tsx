import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CITIES = [
  'Viçosa - MG',
  'Belo Horizonte - MG',
  'São Paulo - SP',
  'Rio de Janeiro - RJ',
  'Brasília - DF',
];

const ROLES: { value: AppRole; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    value: 'COMPANY',
    label: 'Empresa',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Anuncie ofertas e pague por clique',
    color: 'bg-company text-company-foreground',
  },
  {
    value: 'AFFILIATE',
    label: 'Divulgador',
    icon: <Users className="h-5 w-5" />,
    description: 'Compartilhe ofertas e ganhe comissão',
    color: 'bg-affiliate text-affiliate-foreground',
  },
  {
    value: 'CLIENT',
    label: 'Cliente',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Encontre ofertas com IA inteligente',
    color: 'bg-client text-client-foreground',
  },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupCity, setSignupCity] = useState('Viçosa - MG');
  const [signupRole, setSignupRole] = useState<AppRole>('CLIENT');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!signupName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome ou nome da empresa.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupName, signupCity, signupRole);

    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'Este email já está cadastrado. Tente fazer login.';
      }
      toast({
        title: 'Erro no cadastro',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Você já pode acessar a plataforma.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-primary">clilin</span>
            <span className="text-secondary">.</span>
          </h1>
          <p className="text-muted-foreground mt-2">Ofertas locais inteligentes</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>Eu sou...</Label>
                    <div className="grid gap-2">
                      {ROLES.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSignupRole(role.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                            signupRole === role.value
                              ? `border-primary ${role.color}`
                              : 'border-border hover:border-primary/50 bg-card'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${signupRole === role.value ? 'bg-background/20' : 'bg-muted'}`}>
                            {role.icon}
                          </div>
                          <div>
                            <p className="font-medium">{role.label}</p>
                            <p className={`text-xs ${signupRole === role.value ? 'opacity-80' : 'text-muted-foreground'}`}>
                              {role.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">
                      {signupRole === 'COMPANY' ? 'Nome da Empresa' : 'Seu Nome'}
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder={signupRole === 'COMPANY' ? 'Ex: Pizzaria do João' : 'Ex: Maria Silva'}
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-city">Cidade</Label>
                    <Select value={signupCity} onValueChange={setSignupCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao criar uma conta, você concorda com os Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}