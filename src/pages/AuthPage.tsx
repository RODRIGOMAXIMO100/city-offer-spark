import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Building2, Users, Sparkles, Loader2, Check, ChevronsUpDown, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAZIL_STATES, getCitiesByState } from '@/data/brazilLocations';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.png';
import Turnstile from '@/components/Turnstile';

const ROLES: { value: AppRole; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    value: 'COMPANY',
    label: 'Empresa',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Anuncie ofertas e pague por interesse real',
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
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupState, setSignupState] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupRole, setSignupRole] = useState<AppRole>('CLIENT');
  const [signupCnpj, setSignupCnpj] = useState('');
  const [signupTelefone, setSignupTelefone] = useState('');
  const [openCityCombobox, setOpenCityCombobox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Honeypot field - invisible to users, bots will fill it
  const [honeypot, setHoneypot] = useState('');
  
  // Turnstile tokens
  const [loginTurnstileToken, setLoginTurnstileToken] = useState<string | null>(null);
  const [signupTurnstileToken, setSignupTurnstileToken] = useState<string | null>(null);

  const handleLoginTurnstileVerify = useCallback((token: string) => {
    setLoginTurnstileToken(token);
  }, []);

  const handleLoginTurnstileExpire = useCallback(() => {
    setLoginTurnstileToken(null);
  }, []);

  const handleSignupTurnstileVerify = useCallback((token: string) => {
    setSignupTurnstileToken(token);
  }, []);

  const handleSignupTurnstileExpire = useCallback(() => {
    setSignupTurnstileToken(null);
  }, []);

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupCnpj(formatCnpj(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupTelefone(formatTelefone(e.target.value));
  };

  const cnpjNumbers = signupCnpj.replace(/\D/g, '');

  const availableCities = useMemo(() => {
    if (!signupState) return [];
    return getCitiesByState(signupState).sort();
  }, [signupState]);

  const formattedCity = useMemo(() => {
    if (!signupCity || !signupState) return '';
    return `${signupCity} - ${signupState}`;
  }, [signupCity, signupState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginTurnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Por favor, complete a verificação de segurança.',
        variant: 'destructive',
      });
      return;
    }
    
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

    // Validate CNPJ for companies
    if (signupRole === 'COMPANY') {
      if (cnpjNumbers.length !== 14) {
        toast({
          title: 'CNPJ inválido',
          description: 'Por favor, informe um CNPJ válido com 14 dígitos.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Check eligibility before signup (honeypot, blacklist, rate limit, turnstile)
    if (!signupTurnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Por favor, complete a verificação de segurança.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: eligibilityData, error: eligibilityError } = await supabase.functions.invoke('check-signup-eligibility', {
        body: {
          email: signupEmail,
          cpf: signupRole === 'COMPANY' ? cnpjNumbers : null,
          honeypot: honeypot,
          turnstileToken: signupTurnstileToken
        }
      });

      if (eligibilityError) {
        console.error('Eligibility check error:', eligibilityError);
        // Continue with signup if check fails (fail open for UX)
      } else if (!eligibilityData?.eligible) {
        toast({
          title: 'Cadastro não permitido',
          description: eligibilityData?.message || 'Não foi possível criar sua conta.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    } catch (checkError) {
      console.error('Error checking eligibility:', checkError);
      // Continue with signup if check fails (fail open for UX)
    }

    const telefoneNumbers = signupTelefone.replace(/\D/g, '');
    const { error } = await signUp(
      signupEmail, 
      signupPassword, 
      signupName, 
      signupRole === 'CLIENT' ? '' : formattedCity, // Clients don't need city
      signupRole, 
      signupRole === 'COMPANY' ? cnpjNumbers : undefined,
      signupRole === 'CLIENT' ? telefoneNumbers : undefined
    );

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
          <img src={logoImg} alt="clilin" className="h-14 mx-auto" />
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

                  {/* Cloudflare Turnstile for Login */}
                  <div className="flex justify-center">
                    <Turnstile
                      onVerify={handleLoginTurnstileVerify}
                      onExpire={handleLoginTurnstileExpire}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !loginTurnstileToken}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isGoogleLoading}
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      const { error } = await signInWithGoogle();
                      if (error) {
                        toast({
                          title: 'Erro ao entrar com Google',
                          description: error.message,
                          variant: 'destructive',
                        });
                        setIsGoogleLoading(false);
                      }
                    }}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Continuar com Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Google Sign Up Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isGoogleLoading}
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      const { error } = await signInWithGoogle();
                      if (error) {
                        toast({
                          title: 'Erro ao cadastrar com Google',
                          description: error.message,
                          variant: 'destructive',
                        });
                        setIsGoogleLoading(false);
                      }
                    }}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Cadastrar com Google
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou continue com email</span>
                    </div>
                  </div>

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

                  {/* CNPJ Field - Only for Companies */}
                  {signupRole === 'COMPANY' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-cnpj">CNPJ</Label>
                      <Input
                        id="signup-cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={signupCnpj}
                        onChange={handleCnpjChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Obrigatório para empresas. Usado para emissão de nota fiscal.
                      </p>
                    </div>
                  )}

                  {/* Telefone Field - Only for Clients */}
                  {signupRole === 'CLIENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-telefone">Telefone</Label>
                      <Input
                        id="signup-telefone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={signupTelefone}
                        onChange={handleTelefoneChange}
                        required
                      />
                    </div>
                  )}

                  {/* State/City Fields - Only for Companies and Affiliates */}
                  {signupRole !== 'CLIENT' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-state">Estado (UF)</Label>
                        <Select value={signupState} onValueChange={(value) => {
                          setSignupState(value);
                          setSignupCity('');
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZIL_STATES.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.code} - {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-city">Cidade</Label>
                        <Popover open={openCityCombobox} onOpenChange={setOpenCityCombobox}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCityCombobox}
                              className="w-full justify-between"
                              disabled={!signupState}
                            >
                              {signupCity || "Selecione a cidade..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Digite para buscar..." />
                              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {availableCities.map((city) => (
                                  <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={(currentValue) => {
                                      setSignupCity(currentValue === signupCity ? "" : currentValue);
                                      setOpenCityCombobox(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        signupCity === city ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {city}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}

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
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        minLength={6}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Honeypot field - invisible to users, bots will fill it */}
                  <div 
                    className="absolute left-[-9999px] top-[-9999px]" 
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                  >
                    <Input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {/* Cloudflare Turnstile for Signup */}
                  <div className="flex justify-center">
                    <Turnstile
                      onVerify={handleSignupTurnstileVerify}
                      onExpire={handleSignupTurnstileExpire}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !signupTurnstileToken}>
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