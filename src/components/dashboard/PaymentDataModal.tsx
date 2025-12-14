import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wallet } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { 
  validateCPF, 
  validateCNPJ, 
  formatCPF, 
  formatCNPJ, 
  isCPFComplete,
  isCNPJComplete 
} from '@/lib/validators';

interface PaymentDataModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PIX_TYPES = [
  { value: 'CPF', label: 'CPF' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'ALEATORIA', label: 'Chave aleatória' },
];

export default function PaymentDataModal({ open, onClose, onSuccess }: PaymentDataModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cpf: '',
    nome_completo: '',
    pix_tipo: '',
    pix_key: '',
  });

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

  const handleChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cpf') formatted = formatCPF(value);
    if (field === 'pix_key') formatted = formatPixKey(value, formData.pix_tipo);
    
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Validation states for CPF
  const cpfComplete = isCPFComplete(formData.cpf);
  const cpfValid = cpfComplete ? validateCPF(formData.cpf) : null;

  // Validation states for PIX key (when CPF or CNPJ type)
  const getPixKeyValidation = () => {
    if (formData.pix_tipo === 'CPF') {
      const complete = isCPFComplete(formData.pix_key);
      return { complete, valid: complete ? validateCPF(formData.pix_key) : null };
    }
    if (formData.pix_tipo === 'CNPJ') {
      const complete = isCNPJComplete(formData.pix_key);
      return { complete, valid: complete ? validateCNPJ(formData.pix_key) : null };
    }
    return { complete: false, valid: null };
  };

  const pixKeyValidation = getPixKeyValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCPF(formData.cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, verifique os dígitos do CPF informado.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.nome_completo.trim() || formData.nome_completo.trim().split(' ').length < 2) {
      toast({
        title: 'Nome completo obrigatório',
        description: 'Por favor, insira seu nome completo (nome e sobrenome).',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.pix_tipo) {
      toast({
        title: 'Tipo de chave PIX obrigatório',
        description: 'Por favor, selecione o tipo da sua chave PIX.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.pix_key.trim()) {
      toast({
        title: 'Chave PIX obrigatória',
        description: 'Por favor, insira sua chave PIX.',
        variant: 'destructive',
      });
      return;
    }

    // Validate PIX key based on type
    if (formData.pix_tipo === 'CPF' && !validateCPF(formData.pix_key)) {
      toast({
        title: 'Chave PIX (CPF) inválida',
        description: 'O CPF informado como chave PIX é inválido.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.pix_tipo === 'CNPJ' && !validateCNPJ(formData.pix_key)) {
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
        cpf: formData.cpf,
        nome_completo: formData.nome_completo.trim(),
        pix_tipo: formData.pix_tipo,
        pix_key: formData.pix_key.trim(),
      })
      .eq('id', profile?.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    await refreshProfile();
    toast({
      title: 'Dados salvos!',
      description: 'Seus dados de pagamento foram cadastrados com sucesso.',
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-affiliate" />
            Dados para Pagamento
          </DialogTitle>
          <DialogDescription>
            Para realizar saques, precisamos dos seus dados bancários. 
            Você só precisa preencher isso uma vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <ValidatedInput
              id="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              required
              isValid={cpfValid}
              showValidation={cpfComplete}
              errorMessage="CPF inválido. Verifique os dígitos."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input
              id="nome_completo"
              placeholder="Seu nome igual ao documento"
              value={formData.nome_completo}
              onChange={(e) => handleChange('nome_completo', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Importante: deve ser igual ao nome cadastrado no seu banco
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_tipo">Tipo de Chave PIX *</Label>
            <Select
              value={formData.pix_tipo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pix_tipo: value, pix_key: '' }))}
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
            <Label htmlFor="pix_key">Chave PIX *</Label>
            {(formData.pix_tipo === 'CPF' || formData.pix_tipo === 'CNPJ') ? (
              <ValidatedInput
                id="pix_key"
                placeholder={
                  formData.pix_tipo === 'CPF' ? '000.000.000-00' :
                  '00.000.000/0000-00'
                }
                value={formData.pix_key}
                onChange={(e) => handleChange('pix_key', e.target.value)}
                required
                isValid={pixKeyValidation.valid}
                showValidation={pixKeyValidation.complete}
                errorMessage={`${formData.pix_tipo} inválido. Verifique os dígitos.`}
              />
            ) : (
              <Input
                id="pix_key"
                placeholder={
                  formData.pix_tipo === 'EMAIL' ? 'email@exemplo.com' :
                  formData.pix_tipo === 'TELEFONE' ? '+55 00 00000-0000' :
                  'Cole sua chave aleatória'
                }
                value={formData.pix_key}
                onChange={(e) => handleChange('pix_key', e.target.value)}
                required
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-affiliate hover:bg-affiliate/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Continuar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
