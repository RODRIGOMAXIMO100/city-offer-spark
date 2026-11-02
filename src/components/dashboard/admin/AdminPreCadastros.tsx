import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Loader2, MapPin, MessageCircle, Mail, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Pré-cadastros: quem tentou se cadastrar numa cidade que ainda não abriu (hoje, tudo fora de BH)
// e quem pediu aviso das ofertas. Vem da tabela city_waitlist.

interface Linha {
  id: string;
  city_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  created_at: string;
  cidade: string;
}

const PAPEL: Record<string, { rotulo: string; classe: string }> = {
  COMPANY: { rotulo: 'Empresa', classe: 'bg-company text-company-foreground' },
  AFFILIATE: { rotulo: 'Divulgador', classe: 'bg-affiliate text-affiliate-foreground' },
  CLIENT: { rotulo: 'Cliente', classe: 'bg-muted text-foreground' },
};

const FILTROS = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'COMPANY', rotulo: 'Empresas' },
  { id: 'AFFILIATE', rotulo: 'Divulgadores' },
  { id: 'CLIENT', rotulo: 'Clientes' },
];

const wa = (p: string | null) => {
  const d = (p || '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return d.startsWith('55') && d.length >= 12 ? d : '55' + d;
};

const foneBonito = (p: string | null) => {
  const d = (p || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p || '';
};

export default function AdminPreCadastros() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const { data } = await supabase
        .from('city_waitlist')
        .select('id, city_id, name, email, phone, role, created_at')
        .order('created_at', { ascending: false })
        .limit(2000);
      const rows = (data || []) as Omit<Linha, 'cidade'>[];
      const ids = [...new Set(rows.map((r) => r.city_id).filter(Boolean))] as string[];
      const nomes: Record<string, string> = {};
      for (let i = 0; i < ids.length; i += 200) {
        const { data: cs } = await supabase
          .from('available_cities')
          .select('id, city_name, state_code')
          .in('id', ids.slice(i, i + 200));
        (cs || []).forEach((c: any) => (nomes[c.id] = `${c.city_name} - ${c.state_code}`));
      }
      setLinhas(rows.map((r) => ({ ...r, cidade: r.city_id ? nomes[r.city_id] || 'Cidade' : 'Aviso de ofertas (sem cidade)' })));
      setCarregando(false);
    })();
  }, []);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return linhas.filter(
      (l) =>
        (filtro === 'todos' || l.role === filtro) &&
        (!q || [l.name, l.email, l.cidade, l.phone || ''].some((v) => v.toLowerCase().includes(q))),
    );
  }, [linhas, filtro, busca]);

  const totais = useMemo(() => {
    const t = { todos: linhas.length, COMPANY: 0, AFFILIATE: 0, CLIENT: 0 } as Record<string, number>;
    linhas.forEach((l) => (t[l.role || 'CLIENT'] = (t[l.role || 'CLIENT'] || 0) + 1));
    return t;
  }, [linhas]);

  const topCidades = useMemo(() => {
    const m: Record<string, number> = {};
    linhas.filter((l) => l.city_id).forEach((l) => (m[l.cidade] = (m[l.cidade] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [linhas]);

  const baixar = () => {
    const cab = ['data', 'nome', 'papel', 'cidade', 'whatsapp', 'email'];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cab.join(';')]
      .concat(
        visiveis.map((l) =>
          [format(new Date(l.created_at), 'dd/MM/yyyy HH:mm'), l.name, PAPEL[l.role || 'CLIENT']?.rotulo || l.role, l.cidade, foneBonito(l.phone), l.email]
            .map((v) => esc(v || ''))
            .join(';'),
        ),
      )
      .join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-cadastros-clilin-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Pré-cadastros</h1>
        <p className="text-muted-foreground">
          O cadastro está aberto só em Belo Horizonte. Quem é de outra cidade cai aqui. Quando abrir uma cidade (em Cidades), chame essas pessoas pelo WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${filtro === f.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
          >
            <p className="text-sm text-muted-foreground">{f.rotulo}</p>
            <p className="text-2xl font-display font-bold">{totais[f.id] || 0}</p>
          </button>
        ))}
      </div>

      {topCidades.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Cidades com mais pré-cadastros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {topCidades.map(([c, n]) => (
              <button key={c} onClick={() => setBusca(c.split(' - ')[0])} className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
                {c} <strong className="ml-1">{n}</strong>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, cidade, email ou WhatsApp" className="pl-9" />
        </div>
        <Button variant="outline" onClick={baixar} disabled={!visiveis.length}>
          <Download className="h-4 w-4 mr-2" /> Baixar planilha
        </Button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
          {linhas.length ? 'Ninguém com esse filtro.' : 'Ainda não tem pré-cadastro.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visiveis.map((l) => {
            const p = PAPEL[l.role || 'CLIENT'] || PAPEL.CLIENT;
            const w = wa(l.phone);
            return (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{l.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {l.cidade}
                    </p>
                  </div>
                  <Badge className={p.classe}>{p.rotulo}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {w && (
                    <a href={`https://wa.me/${w}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70">
                      <MessageCircle className="h-4 w-4" /> {foneBonito(l.phone)}
                    </a>
                  )}
                  <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70 min-w-0">
                    <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{l.email}</span>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(l.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
