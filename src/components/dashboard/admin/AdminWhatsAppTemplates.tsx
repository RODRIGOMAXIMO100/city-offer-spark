import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';

interface TemplateResult {
  name: string;
  ok: boolean;
  status: number;
  response: any;
}

export default function AdminWhatsAppTemplates() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TemplateResult[]>([]);

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
    </div>
  );
}
