import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle2, XCircle, TestTube2 } from 'lucide-react';

interface TemplateResult {
  name: string;
  ok: boolean;
  status: number;
  response: any;
}

const TEMPLATE_VARS: Record<string, { label: string; placeholder: string }[]> = {
  clilin_cupom: [
    { label: 'Oferta', placeholder: 'Corte + Barba' },
    { label: 'Empresa', placeholder: 'Barbearia Teste' },
    { label: 'Código', placeholder: 'TESTE1234' },
    { label: 'Validade', placeholder: '31/12/2026' },
  ],
  clilin_resgate_confirmado: [
    { label: 'Oferta', placeholder: 'Corte + Barba' },
  ],
};

export default function AdminWhatsAppTemplates() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TemplateResult[]>([]);

  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testTemplate, setTestTemplate] = useState<string>('clilin_cupom');
  const [testPhone, setTestPhone] = useState<string>('');
  const [testVars, setTestVars] = useState<string[]>(['', '', '', '']);

  const submitTemplates = async () => {
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('create-wa-templates');
      if (error) throw error;
      setResults(data?.results ?? []);
      const okCount = (data?.results ?? []).filter((r: TemplateResult) => r.ok).length;
      toast.success(`${okCount}/${data?.results?.length ?? 0} templates enviados para aprovação da Meta`);
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    if (!testPhone) {
      toast.error('Informe o número de WhatsApp de destino');
      return;
    }
    const fields = TEMPLATE_VARS[testTemplate];
    const vars = testVars.slice(0, fields.length).map((v, i) => v || fields[i].placeholder);

    setTestLoading(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-wa-template-test', {
        body: { template: testTemplate, to: testPhone, variables: vars },
      });
      if (error) throw error;
      setTestResult(data);
      if (data?.ok) {
        toast.success('Enviado! Confira o WhatsApp de destino.');
      } else {
        toast.error(`Meta retornou HTTP ${data?.status}`);
      }
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const currentFields = TEMPLATE_VARS[testTemplate];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Templates de WhatsApp</CardTitle>
          <CardDescription>
            Envia os templates <strong>clilin_cupom</strong> e <strong>clilin_resgate_confirmado</strong> (pt_BR, UTILITY)
            direto para aprovação da Meta via WhatsApp Business API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div><strong>clilin_cupom</strong> — Cupom emitido — 4 variáveis (oferta, empresa, código, validade)</div>
            <div><strong>clilin_resgate_confirmado</strong> — Cupom resgatado — 1 variável (oferta)</div>
          </div>

          <Button onClick={submitTemplates} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar templates para aprovação
          </Button>

          {results.length > 0 && (
            <div className="space-y-3 pt-4">
              {results.map((r) => (
                <div key={r.name} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {r.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <Badge variant={r.ok ? 'default' : 'destructive'}>HTTP {r.status}</Badge>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(r.response, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Depois do envio, acompanhe o status em WhatsApp Manager → Message Templates. A aprovação da Meta costuma sair em minutos ou algumas horas.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" /> Testar envio com variáveis
          </CardTitle>
          <CardDescription>
            Envie o template para um WhatsApp real com valores diferentes dos exemplos, para validar que as variáveis funcionam.
            Só funciona depois que a Meta aprovar o template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={testTemplate}
                onValueChange={(v) => {
                  setTestTemplate(v);
                  setTestVars(new Array(TEMPLATE_VARS[v].length).fill(''));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clilin_cupom">clilin_cupom (4 variáveis)</SelectItem>
                  <SelectItem value="clilin_resgate_confirmado">clilin_resgate_confirmado (1 variável)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp de destino</Label>
              <Input
                placeholder="5531964182970"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">DDI + DDD + número. Se omitir o 55, adicionamos automaticamente.</p>
            </div>
          </div>

          <div className="space-y-3">
            {currentFields.map((f, i) => (
              <div key={i} className="space-y-1">
                <Label>{`{{${i + 1}}} — ${f.label}`}</Label>
                <Input
                  placeholder={f.placeholder}
                  value={testVars[i] ?? ''}
                  onChange={(e) => {
                    const next = [...testVars];
                    next[i] = e.target.value;
                    setTestVars(next);
                  }}
                />
              </div>
            ))}
          </div>

          <Button onClick={sendTest} disabled={testLoading}>
            {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar teste
          </Button>

          {testResult && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {testResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">Resultado</span>
                </div>
                <Badge variant={testResult.ok ? 'default' : 'destructive'}>HTTP {testResult.status}</Badge>
              </div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
