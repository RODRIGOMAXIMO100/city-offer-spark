import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Check, ChevronsUpDown, Eye, EyeOff, ArrowRight, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAZIL_STATES, getCitiesByState } from '@/data/brazilLocations';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Turnstile from '@/components/Turnstile';
import CityWaitlistModal from './CityWaitlistModal';

interface SignupFormProps {
  role: AppRole;
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
  compact?: boolean;
}

export default function SignupForm({ 
  role, 
  title, 
  description, 
  buttonText = "Criar Conta Grátis",
  className = "",
  compact = false
}: SignupFormProps) {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [openCityCombobox, setOpenCityCombobox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  // Available cities from database
  const [availableCitiesFromDb, setAvailableCitiesFromDb] = useState<{id: string; state_code: string; city_name: string}[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [selectedUnavailableCity, setSelectedUnavailableCity] = useState<{id: string; name: string; state: string} | null>(null);

  // Fetch available cities from database
  useEffect(() => {
    const fetchAvailableCities = async () => {
      try {
        const { data, error } = await supabase
          .from('available_cities')
          .select('id, state_code, city_name')
          .eq('active', true);
        
        if (error) throw error;
        setAvailableCitiesFromDb(data || []);
      } catch (err) {
        console.error('Error fetching available cities:', err);
        // Fallback: allow all cities if database fails
        setAvailableCitiesFromDb([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchAvailableCities();
  }, []);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
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
    setCnpj(formatCnpj(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatTelefone(e.target.value));
  };

  const cnpjNumbers = cnpj.replace(/\D/g, '');

  // Check if we should use database cities or fallback to static
  const hasDbCities = availableCitiesFromDb.length > 0;
  
  // Available states (only those with active cities in database)
  const availableStatesFromDb = useMemo(() => {
    if (!hasDbCities) return BRAZIL_STATES;
    const activeStateCodes = new Set(availableCitiesFromDb.map(c => c.state_code));
    return BRAZIL_STATES.filter(s => activeStateCodes.has(s.code));
  }, [availableCitiesFromDb, hasDbCities]);
  
  // Cities for selected state (from database or fallback)
  const availableCities = useMemo(() => {
    if (!state) return [];
    
    if (hasDbCities) {
      // Use database cities
      return availableCitiesFromDb
        .filter(c => c.state_code === state)
        .map(c => c.city_name)
        .sort();
    }
    
    // Fallback to static cities if database has no cities
    return getCitiesByState(state).sort();
  }, [state, availableCitiesFromDb, hasDbCities]);
  
  // Check if selected city is available (for showing waitlist option)
  const allCitiesForState = useMemo(() => {
    if (!state) return [];
    return getCitiesByState(state).sort();
  }, [state]);
  
  // Find unavailable city ID for waitlist
  const findUnavailableCityId = async (cityName: string, stateCode: string) => {
    const { data } = await supabase
      .from('available_cities')
      .select('id')
      .eq('state_code', stateCode)
      .eq('city_name', cityName)
      .single();
    return data?.id;
  };

  const formattedCity = useMemo(() => {
    if (!city || !state) return '';
    return `${city} - ${state}`;
  }, [city, state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome ou nome da empresa.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (role === 'COMPANY') {
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

    if (!turnstileToken) {
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
          email: email,
          cpf: role === 'COMPANY' ? cnpjNumbers : null,
          honeypot: honeypot,
          turnstileToken: turnstileToken
        }
      });

      if (eligibilityError) {
        console.error('Eligibility check error:', eligibilityError);
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
    }

    const telefoneNumbers = telefone.replace(/\D/g, '');
    const { error } = await signUp(
      email, 
      password, 
      name, 
      role === 'CLIENT' ? '' : formattedCity,
      role, 
      role === 'COMPANY' ? cnpjNumbers : undefined,
      role === 'CLIENT' ? telefoneNumbers : undefined
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

  const handleGoogleSignup = async () => {
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
  };

  return (
    <div className={cn("w-full", className)}>
      {(title || description) && (
        <div className="text-center mb-6">
          {title && <h3 className="text-2xl font-bold mb-2">{title}</h3>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Google Sign Up Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isGoogleLoading}
          onClick={handleGoogleSignup}
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

        <div className="space-y-2">
          <Label htmlFor={`signup-name-${role}`}>
            {role === 'COMPANY' ? 'Nome da Empresa' : 'Seu Nome'}
          </Label>
          <Input
            id={`signup-name-${role}`}
            type="text"
            placeholder={role === 'COMPANY' ? 'Ex: Pizzaria do João' : 'Ex: Maria Silva'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* CNPJ Field - Only for Companies */}
        {role === 'COMPANY' && (
          <div className="space-y-2">
            <Label htmlFor={`signup-cnpj-${role}`}>CNPJ</Label>
            <Input
              id={`signup-cnpj-${role}`}
              type="text"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCnpjChange}
              required
            />
          </div>
        )}

        {/* Telefone Field - Only for Clients */}
        {role === 'CLIENT' && (
          <div className="space-y-2">
            <Label htmlFor={`signup-telefone-${role}`}>Telefone</Label>
            <Input
              id={`signup-telefone-${role}`}
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={handleTelefoneChange}
              required
            />
          </div>
        )}

        {/* State/City Fields - Only for Companies and Affiliates */}
        {role !== 'CLIENT' && (
          <div className={compact ? "grid grid-cols-2 gap-3" : "space-y-4"}>
            <div className="space-y-2">
              <Label htmlFor={`signup-state-${role}`}>Estado</Label>
              <Select value={state} onValueChange={(value) => {
                setState(value);
                setCity('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatesFromDb.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasDbCities && availableStatesFromDb.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Em breve estaremos na sua região! 💛
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`signup-city-${role}`}>Cidade</Label>
              <Popover open={openCityCombobox} onOpenChange={setOpenCityCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCityCombobox}
                    className="w-full justify-between"
                    disabled={!state || loadingCities}
                  >
                    {loadingCities ? "Carregando..." : city || "Selecione..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cidade..." />
                    <CommandEmpty>
                      {hasDbCities ? "Cidade não disponível ainda" : "Nenhuma cidade encontrada."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-auto">
                      {availableCities.map((c) => (
                        <CommandItem
                          key={c}
                          value={c}
                          onSelect={(currentValue) => {
                            setCity(currentValue === city ? "" : currentValue);
                            setOpenCityCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              city === c ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {hasDbCities && state && availableCities.length === 0 && (
                <p className="text-xs text-amber-600">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Ainda não chegamos neste estado. Em breve! 💛
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`signup-email-${role}`}>Email</Label>
          <Input
            id={`signup-email-${role}`}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`signup-password-${role}`}>Senha</Label>
          <div className="relative">
            <Input
              id={`signup-password-${role}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Honeypot field */}
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

        {/* Cloudflare Turnstile */}
        <div className="flex justify-center">
          <Turnstile
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading || !turnstileToken}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com os Termos de Uso e Política de Privacidade.
        </p>
      </form>
    </div>
  );
}
