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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatPixKey = (value: string, type: string) => {
    if (type === 'CPF') return formatCPF(value);
    if (type === 'CNPJ') {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }
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

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validate digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCPF(formData.cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, insira um CPF válido.',
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
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              required
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
            <Input
              id="pix_key"
              placeholder={
                formData.pix_tipo === 'CPF' ? '000.000.000-00' :
                formData.pix_tipo === 'EMAIL' ? 'email@exemplo.com' :
                formData.pix_tipo === 'TELEFONE' ? '+55 00 00000-0000' :
                formData.pix_tipo === 'CNPJ' ? '00.000.000/0000-00' :
                'Cole sua chave aleatória'
              }
              value={formData.pix_key}
              onChange={(e) => handleChange('pix_key', e.target.value)}
              required
            />
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
