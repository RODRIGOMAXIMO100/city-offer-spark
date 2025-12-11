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
import { Loader2, Building2 } from 'lucide-react';

interface FiscalDataModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FiscalDataModal({ open, onClose, onSuccess }: FiscalDataModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    endereco_fiscal: '',
    cep: '',
    telefone: '',
  });

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

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

  const handleChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'cnpj') formatted = formatCNPJ(value);
    if (field === 'cep') formatted = formatCEP(value);
    if (field === 'telefone') formatted = formatPhone(value);
    
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const validateCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.length === 14;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Por favor, insira um CNPJ válido com 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.razao_social.trim()) {
      toast({
        title: 'Razão Social obrigatória',
        description: 'Por favor, insira a razão social da empresa.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        cnpj: formData.cnpj,
        razao_social: formData.razao_social.trim(),
        endereco_fiscal: formData.endereco_fiscal.trim() || null,
        cep: formData.cep || null,
        telefone: formData.telefone || null,
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
      description: 'Seus dados fiscais foram cadastrados com sucesso.',
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-company" />
            Dados para Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Para emitir notas fiscais, precisamos dos dados da sua empresa. 
            Você só precisa preencher isso uma vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              placeholder="Nome da empresa conforme CNPJ"
              value={formData.razao_social}
              onChange={(e) => handleChange('razao_social', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco_fiscal">Endereço Fiscal</Label>
            <Input
              id="endereco_fiscal"
              placeholder="Rua, número, bairro, cidade - UF"
              value={formData.endereco_fiscal}
              onChange={(e) => handleChange('endereco_fiscal', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-company hover:bg-company/90"
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
