import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BRAZIL_STATES, BRAZIL_CITIES } from '@/data/brazilLocations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User, Building2, Wallet, MapPin } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  isCPFComplete,
  isCNPJComplete 
} from '@/lib/validators';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
  userType: 'COMPANY' | 'AFFILIATE' | 'CLIENT';
}

const PIX_TYPES = [
  { value: 'CPF', label: 'CPF' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'ALEATORIA', label: 'Chave aleatória' },
];

export default function ProfileSettingsModal({ open, onClose, userType }: ProfileSettingsModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Basic data
  const [name, setName] = useState('');
  const [telefone, setTelefone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fiscal data (Company)
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [enderecoFiscal, setEnderecoFiscal] = useState('');
  const [cep, setCep] = useState('');

  // Payment data (Affiliate)
  const [cpf, setCpf] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [pixTipo, setPixTipo] = useState('');
  const [pixKey, setPixKey] = useState('');

  // Initialize form with profile data
  useEffect(() => {
    if (profile && open) {
      setName(profile.name || '');
      setTelefone(profile.telefone || '');
      
      // Parse city to get state and city
      if (profile.city) {
        const parts = profile.city.split(' - ');
        if (parts.length === 2) {
          const cityName = parts[0];
          const stateCode = parts[1];
          setSelectedState(stateCode);
          setSelectedCity(cityName);
        }
      }

      // Fiscal data
      setCnpj(profile.cnpj || '');
      setRazaoSocial(profile.razao_social || '');
      setEnderecoFiscal(profile.endereco_fiscal || '');
      setCep(profile.cep || '');

      // Payment data
      setCpf(profile.cpf || '');
      setNomeCompleto(profile.nome_completo || '');
      setPixTipo(profile.pix_tipo || '');
      setPixKey(profile.pix_key || '');
    }
  }, [profile, open]);

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatPixKey = (value: string, type: string) => {
    if (type === 'CPF') return formatCPF(value);
    if (type === 'CNPJ') return formatCNPJ(value);
    if (type === 'TELEFONE') {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/^(\d{2})(\d)/, '+$1 $2')
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 17);
    }
    return value;
  };

  // Validation states
  const cnpjComplete = isCNPJComplete(cnpj);
  const cnpjValid = cnpjComplete ? validateCNPJ(cnpj) : null;
  
  const cpfComplete = isCPFComplete(cpf);
  const cpfValid = cpfComplete ? validateCPF(cpf) : null;

  const getPixKeyValidation = () => {
    if (pixTipo === 'CPF') {
      const complete = isCPFComplete(pixKey);
      return { complete, valid: complete ? validateCPF(pixKey) : null };
    }
    if (pixTipo === 'CNPJ') {
      const complete = isCNPJComplete(pixKey);
      return { complete, valid: complete ? validateCNPJ(pixKey) : null };
    }
    return { complete: false, valid: null };
  };

  const pixKeyValidation = getPixKeyValidation();

  const handleSaveBasicData = async () => {
    if (!profile) return;

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira seu nome.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedState || !selectedCity) {
      toast({
        title: 'Localização obrigatória',
        description: 'Por favor, selecione seu estado e cidade.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const cityFormatted = `${selectedCity} - ${selectedState}`;
    const cityChanged = cityFormatted !== profile.city;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        city: cityFormatted,
        telefone: telefone || null,
      })
      .eq('id', profile.id);

    if (error) {
      setLoading(false);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Se a cidade mudou e é uma empresa, atualizar todas as ofertas ativas
    if (cityChanged && userType === 'COMPANY') {
      const { error: offersError } = await supabase
        .from('offers')
        .update({ city: cityFormatted })
        .eq('company_id', profile.id)
        .eq('active', true)
        .is('deleted_at', null);

      if (offersError) {
        console.error('Erro ao atualizar ofertas:', offersError);
      }
    }

    await refreshProfile();
    toast({
      title: 'Dados salvos!',
      description: cityChanged && userType === 'COMPANY' 
        ? 'Seus dados e ofertas foram atualizados para a nova cidade.'
        : 'Seus dados básicos foram atualizados.',
    });

    setLoading(false);
  };

  const handleSaveFiscalData = async () => {
    if (cnpj && !validateCNPJ(cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Por favor, verifique os dígitos do CNPJ informado.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        cnpj: cnpj || null,
        razao_social: razaoSocial.trim() || null,
        endereco_fiscal: enderecoFiscal.trim() || null,
        cep: cep || null,
      })
      .eq('id', profile?.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
      toast({
        title: 'Dados salvos!',
        description: 'Seus dados fiscais foram atualizados.',
      });
    }

    setLoading(false);
  };

  const handleSavePaymentData = async () => {
    if (cpf && !validateCPF(cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, verifique os dígitos do CPF informado.',
        variant: 'destructive',
      });
      return;
    }

    if (nomeCompleto && nomeCompleto.trim().split(' ').length < 2) {
      toast({
        title: 'Nome incompleto',
        description: 'Por favor, insira nome e sobrenome.',
        variant: 'destructive',
      });
      return;
    }

    // Validate PIX key based on type
    if (pixTipo === 'CPF' && pixKey && !validateCPF(pixKey)) {
      toast({
        title: 'Chave PIX (CPF) inválida',
        description: 'O CPF informado como chave PIX é inválido.',
        variant: 'destructive',
      });
      return;
    }

    if (pixTipo === 'CNPJ' && pixKey && !validateCNPJ(pixKey)) {
      toast({
        title: 'Chave PIX (CNPJ) inválida',
        description: 'O CNPJ informado como chave PIX é inválido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        cpf: cpf || null,
        nome_completo: nomeCompleto.trim() || null,
        pix_tipo: pixTipo || null,
        pix_key: pixKey.trim() || null,
      })
      .eq('id', profile?.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
      toast({
        title: 'Dados salvos!',
        description: 'Seus dados de pagamento foram atualizados.',
      });
    }

    setLoading(false);
  };

  const cities = selectedState ? BRAZIL_CITIES[selectedState] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Configurações do Perfil
          </DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e de pagamento.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">
              <User className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Básico</span>
            </TabsTrigger>
            {userType === 'COMPANY' && (
              <TabsTrigger value="fiscal" className="text-xs sm:text-sm">
                <Building2 className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Fiscal</span>
              </TabsTrigger>
            )}
            {userType === 'AFFILIATE' && (
              <TabsTrigger value="payment" className="text-xs sm:text-sm">
                <Wallet className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Pagamento</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Basic Data Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome {userType === 'COMPANY' ? 'da Empresa' : ''}</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Localização
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZIL_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.code} - {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {userType === 'COMPANY' ? 'Suas ofertas aparecerão nesta cidade.' : 
                 userType === 'AFFILIATE' ? 'Você verá ofertas desta cidade.' : 
                 'Buscaremos ofertas nesta cidade.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
              />
            </div>

            <Button
              onClick={handleSaveBasicData}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Dados Básicos'
              )}
            </Button>
          </TabsContent>

          {/* Fiscal Data Tab (Company only) */}
          {userType === 'COMPANY' && (
            <TabsContent value="fiscal" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <ValidatedInput
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  isValid={cnpjValid}
                  showValidation={cnpjComplete}
                  errorMessage="CNPJ inválido. Verifique os dígitos."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  placeholder="Nome da empresa conforme CNPJ"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco_fiscal">Endereço Fiscal</Label>
                <Input
                  id="endereco_fiscal"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={enderecoFiscal}
                  onChange={(e) => setEnderecoFiscal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(formatCEP(e.target.value))}
                />
              </div>

              <Button
                onClick={handleSaveFiscalData}
                className="w-full bg-company hover:bg-company/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Dados Fiscais'
                )}
              </Button>
            </TabsContent>
          )}

          {/* Payment Data Tab (Affiliate only) */}
          {userType === 'AFFILIATE' && (
            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <ValidatedInput
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  isValid={cpfValid}
                  showValidation={cpfComplete}
                  errorMessage="CPF inválido. Verifique os dígitos."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  placeholder="Seu nome igual ao documento"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deve ser igual ao nome cadastrado no seu banco.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_tipo">Tipo de Chave PIX</Label>
                <Select
                  value={pixTipo}
                  onValueChange={(value) => { setPixTipo(value); setPixKey(''); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIX_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                {(pixTipo === 'CPF' || pixTipo === 'CNPJ') ? (
                  <ValidatedInput
                    id="pix_key"
                    placeholder={
                      pixTipo === 'CPF' ? '000.000.000-00' :
                      '00.000.000/0000-00'
                    }
                    value={pixKey}
                    onChange={(e) => setPixKey(formatPixKey(e.target.value, pixTipo))}
                    isValid={pixKeyValidation.valid}
                    showValidation={pixKeyValidation.complete}
                    errorMessage={`${pixTipo} inválido. Verifique os dígitos.`}
                  />
                ) : (
                  <Input
                    id="pix_key"
                    placeholder={
                      pixTipo === 'EMAIL' ? 'email@exemplo.com' :
                      pixTipo === 'TELEFONE' ? '+55 00 00000-0000' :
                      'Cole sua chave aleatória'
                    }
                    value={pixKey}
                    onChange={(e) => setPixKey(formatPixKey(e.target.value, pixTipo))}
                  />
                )}
              </div>

              <Button
                onClick={handleSavePaymentData}
                className="w-full bg-affiliate hover:bg-affiliate/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Dados de Pagamento'
                )}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
