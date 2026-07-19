import { useState, useEffect } from 'react';
import { useNoIndex } from '@/components/seo/NoIndex';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Building2, Megaphone, Star, Clock } from 'lucide-react';
import { BRAZIL_STATES, getCitiesByState } from '@/data/brazilLocations';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { validateCNPJ, formatCNPJ, isCNPJComplete } from '@/lib/validators';
import CityWaitlistModal from '@/components/auth/CityWaitlistModal';
import { Badge } from '@/components/ui/badge';

type UserRole = 'COMPANY' | 'AFFILIATE' | 'CLIENT';

interface CityFromDb {
  id: string;
  state_code: string;
  city_name: string;
  active: boolean;
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const validatePhone = (phone: string) => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

export default function CompleteSignupPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  
  // City validation states
  const [activeCities, setActiveCities] = useState<CityFromDb[]>([]);
  const [allCitiesFromDb, setAllCitiesFromDb] = useState<CityFromDb[]>([]);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [selectedUnavailableCity, setSelectedUnavailableCity] = useState<{id: string; name: string; state: string} | null>(null);
  
  const cities = selectedState ? getCitiesByState(selectedState) : [];

  // Validation states
  const cnpjComplete = isCNPJComplete(cnpj);
  const cnpjValid = cnpjComplete ? validateCNPJ(cnpj) : null;

  // Fetch cities from database
  useEffect(() => {
    const fetchCities = async () => {
      const { data: activeData } = await supabase
        .from('available_cities')
        .select('id, state_code, city_name, active')
        .eq('active', true);
      setActiveCities(activeData || []);
      
      const { data: allData } = await supabase
        .from('available_cities')
        .select('id, state_code, city_name, active');
      setAllCitiesFromDb(allData || []);
    };
    fetchCities();
  }, []);

  // Check if city is available
  const isCityAvailable = (stateCode: string, cityName: string) => {
    return activeCities.some(c => c.state_code === stateCode && c.city_name === cityName);
  };

  // Handle city selection with validation
  const handleCitySelect = (cityName: string) => {
    if (isCityAvailable(selectedState, cityName)) {
      setSelectedCity(cityName);
      setCityOpen(false);
    } else {
      // Find city in database to get ID
      const cityFromDb = allCitiesFromDb.find(c => c.state_code === selectedState && c.city_name === cityName);
      if (cityFromDb) {
        setSelectedUnavailableCity({ id: cityFromDb.id, name: cityName, state: selectedState });
        setWaitlistModalOpen(true);
        setCityOpen(false);
      } else {
        // City not in DB at all - show toast
        toast.error('Cidade não disponível ainda. Em breve chegaremos aí!');
        setCityOpen(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (existingProfile) {
        navigate('/dashboard');
        return;
      }

      // Pre-fill from Google data
      setEmail(session.user.email || '');
      const googleName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || '';
      setName(googleName);
      
      setCheckingSession(false);
    };

    checkSession();
    
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Selecione o tipo de conta');
      return;
    }

    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Validate role-specific fields
    if (selectedRole === 'COMPANY') {
      if (!companyName.trim()) {
        toast.error('Nome da empresa é obrigatório');
        return;
      }
      if (!validateCNPJ(cnpj)) {
        toast.error('CNPJ inválido. Verifique os dígitos informados.');
        return;
      }
      if (!selectedState || !selectedCity) {
        toast.error('Selecione estado e cidade');
        return;
      }
      // Validate city is active
      if (!isCityAvailable(selectedState, selectedCity)) {
        toast.error('Esta cidade ainda não está disponível. Entre na lista de espera!');
        return;
      }
    }

    if (selectedRole === 'AFFILIATE') {
      if (!selectedState || !selectedCity) {
        toast.error('Selecione estado e cidade');
        return;
      }
      // Validate city is active
      if (!isCityAvailable(selectedState, selectedCity)) {
        toast.error('Esta cidade ainda não está disponível. Entre na lista de espera!');
        return;
      }
    }

    if (selectedRole === 'CLIENT') {
      if (!validatePhone(phone)) {
        toast.error('Telefone inválido');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/auth');
        return;
      }

      const cityValue = selectedRole === 'CLIENT' 
        ? '' 
        : `${selectedCity} - ${selectedState}`;

      // Create profile
      const profileData = {
        user_id: session.user.id,
        name: selectedRole === 'COMPANY' ? companyName : name,
        city: cityValue,
        email: email,
        nome_completo: name,
        balance: selectedRole === 'COMPANY' ? 100 : 0,
        cnpj: selectedRole === 'COMPANY' ? cnpj.replace(/\D/g, '') : null,
        telefone: selectedRole === 'CLIENT' ? phone.replace(/\D/g, '') : null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Erro ao criar perfil');
        return;
      }

      // Create role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: session.user.id,
          role: selectedRole,
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        toast.error('Erro ao definir tipo de conta');
        return;
      }

      // Atualiza o contexto de auth ANTES de navegar
      await refreshProfile();

      toast.success('Que bom ter você conosco! Bem-vindo à comunidade! 💛');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  useNoIndex();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo à Comunidade Clilin! 💛</CardTitle>
          <CardDescription>
            Vamos construir algo incrível juntos — preencha seus dados para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Eu sou...</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('COMPANY')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    selectedRole === 'COMPANY'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Building2 className={cn(
                    "h-8 w-8 mb-2",
                    selectedRole === 'COMPANY' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    selectedRole === 'COMPANY' ? "text-primary" : "text-foreground"
                  )}>Empresa</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedRole('AFFILIATE')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    selectedRole === 'AFFILIATE'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Megaphone className={cn(
                    "h-8 w-8 mb-2",
                    selectedRole === 'AFFILIATE' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    selectedRole === 'AFFILIATE' ? "text-primary" : "text-foreground"
                  )}>Divulgador</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedRole('CLIENT')}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    selectedRole === 'CLIENT'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Star className={cn(
                    "h-8 w-8 mb-2",
                    selectedRole === 'CLIENT' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    selectedRole === 'CLIENT' ? "text-primary" : "text-foreground"
                  )}>Cliente</span>
                </button>
              </div>
            </div>

            {/* Dynamic Fields based on Role */}
            {selectedRole && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Name - Always shown */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                {/* Company-specific fields */}
                {selectedRole === 'COMPANY' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nome da sua empresa"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <ValidatedInput
                        id="cnpj"
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        required
                        isValid={cnpjValid}
                        showValidation={cnpjComplete}
                        errorMessage="CNPJ inválido. Verifique os dígitos."
                      />
                    </div>
                  </>
                )}

                {/* State and City - For Company and Affiliate */}
                {(selectedRole === 'COMPANY' || selectedRole === 'AFFILIATE') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={selectedState}
                        onValueChange={(value) => {
                          setSelectedState(value);
                          setSelectedCity('');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAZIL_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cityOpen}
                            className="w-full justify-between font-normal"
                            disabled={!selectedState}
                          >
                            {selectedCity || "Selecione..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar cidade..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                              <CommandGroup>
                                {cities.map((city) => {
                                  const isAvailable = isCityAvailable(selectedState, city);
                                  return (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={() => handleCitySelect(city)}
                                      className={cn(!isAvailable && "opacity-70")}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedCity === city ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="flex-1">{city}</span>
                                      {!isAvailable && (
                                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 bg-muted">
                                          <Clock className="w-2.5 h-2.5 mr-1" />
                                          Em breve
                                        </Badge>
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Phone - For Client only */}
                {selectedRole === 'CLIENT' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !selectedRole}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Completar Cadastro'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* City Waitlist Modal */}
      {selectedUnavailableCity && (
        <CityWaitlistModal
          open={waitlistModalOpen}
          onOpenChange={setWaitlistModalOpen}
          cityId={selectedUnavailableCity.id}
          cityName={selectedUnavailableCity.name}
          stateName={selectedUnavailableCity.state}
          role={selectedRole || 'CLIENT'}
        />
      )}
    </div>
  );
}
