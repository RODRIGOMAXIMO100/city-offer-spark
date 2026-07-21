# CLAUDE.md — Contexto do projeto Clilin para Claude Code

Este arquivo é lido automaticamente pelo Claude Code toda vez que ele abre o repo.
Ele descreve a arquitetura, as regras e os "não faça isso" do projeto pra você (Claude) mexer sem quebrar nada.

---

## 1. O que é o Clilin

Plataforma de **ofertas locais** que conecta 3 papéis:
- **Empresas (COMPANY)** — publicam ofertas, pagam por lead qualificado
- **Divulgadores (AFFILIATE)** — divulgam ofertas, recebem comissão por lead
- **Clientes (CLIENT)** — descobrem ofertas, pegam cupons via WhatsApp
- **Admin (ADMIN)** — controle total

Terminologia obrigatória (nunca trocar):
- Use **"divulgadores"**, nunca "afiliados" na UI
- Depósito mínimo empresa: **R$ 100**
- Linguagem universal de serviço/comunidade — **nunca terminologia religiosa explícita**

---

## 2. Stack

- **Frontend:** Vite 5 + React 18 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui
- **Backend:** Supabase (Lovable Cloud) — Postgres + Auth + Edge Functions (Deno)
- **Roteamento:** react-router-dom
- **State/Data:** `@tanstack/react-query`, hooks locais
- **SEO:** `react-helmet-async` por rota
- **MCP:** `@lovable.dev/mcp-js` — o próprio app expõe um servidor MCP em `supabase/functions/mcp`

---

## 3. Estrutura de pastas

```
src/
  pages/                   # rotas top-level (LandingPage, DashboardPage, OfferPage, etc.)
  components/
    landing/               # seções da home e páginas /empresas /divulgadores /clientes
    dashboard/             # dashboards por papel (Company, Affiliate, Client)
    dashboard/admin/       # sub-abas do admin (Overview, Cities, SEO, WhatsAppTemplates, etc.)
    seo/                   # SEOHead, NoIndex, StructuredData
    ui/                    # shadcn/ui — NÃO editar componentes gerados
  hooks/                   # useAuth, useOffers, useAvailableCities, etc.
  integrations/supabase/   # AUTO-GERADO — nunca editar client.ts nem types.ts
  lib/
    mcp/                   # servidor MCP do app (index.ts + tools/)
    validators.ts          # CPF/CNPJ etc.
  types/database.ts        # tipos manuais + CONFIG (valores em centavos)

supabase/
  functions/               # edge functions Deno
  migrations/              # migrations SQL — sempre com GRANTs + RLS
  config.toml              # AUTO-GERADO — não editar
```

---

## 4. Regras não-negociáveis

### Banco de dados
- **Toda tabela em `public`** precisa de `GRANT` + `ENABLE ROW LEVEL SECURITY` + policies **na mesma migration**.
- **Nunca** guardar role no `profiles` — sempre em `public.user_roles` + função `has_role()` SECURITY DEFINER.
- **Valores monetários em centavos** (integer). Use helpers em `src/types/database.ts` (`formatCentsToBRL`).
- **Nunca** editar schemas: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.

### Edge Functions
- CORS obrigatório: `import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'` em **toda** resposta, inclusive erros.
- Auth: valide o JWT no código com `supabase.auth.getClaims(token)` — a maioria das functions roda com `verify_jwt = false`.
- Valide input com Zod. Retorne 400 com mensagem clara.
- Nunca rodar SQL arbitrário (`execute_sql`). Sempre client tipado com parâmetros.
- Depois de editar, **redeploy**: no Lovable acontece automático; localmente use `supabase functions deploy <nome>`.

### MCP (servidor deste app em `src/lib/mcp/`)
- Uma tool por arquivo em `src/lib/mcp/tools/`, `defineTool` com `inputSchema` Zod.
- Registre em `src/lib/mcp/index.ts` no array `tools`.
- **Nunca** editar `supabase/functions/mcp/index.ts` — é gerado pelo `mcpPlugin()` do Vite.
- Depois de qualquer mudança no MCP: rode o build (`npm run build`) — o plugin regenera a function — e faça deploy.
- Autenticação já configurada via `auth.oauth.issuer` apontando pro Supabase Auth do projeto.

### Frontend
- **Design tokens** em `src/index.css` (HSL). **Nunca** hardcode `text-white`, `bg-black`, `bg-[#fff]` — use tokens semânticos.
- Cores por papel: **Empresas = Azul**, **Divulgadores = Verde**, **Clientes = Roxo**.
- Mobile-first. Tabelas em mobile viram **cards empilhados**.
- SEO: cada rota pública usa `<Helmet>` com `title`, `description`, canonical, og. Rotas privadas usam `useNoIndex()`.
- Sitemap `public/sitemap.xml` é **estático** — atualização manual quando criar página nova.

### Auth
- Cliente: sempre `import { supabase } from "@/integrations/supabase/client"`.
- Nunca criar client novo no browser.
- Providers habilitados: Email/Senha + Google.
- OAuth callback: `${origin}/auth/callback`. Rota `/complete-signup` cria profile+role se faltar.

---

## 5. Ferramentas MCP já disponíveis (23)

Leitura: `whoami`, `list_offers`, `list_my_offers`, `list_my_leads`, `list_my_coupons`, `get_my_earnings`, `admin_overview`, `list_companies`, `list_affiliates`, `list_withdrawals`, `list_cities`, `list_blog_posts`.

Escrita: `create_offer`, `update_offer`, `delete_offer`, `set_offer_active`, `adjust_user_balance`, `set_user_banned`, `set_balance_frozen`, `set_withdrawal_status`, `set_city_active`, `publish_blog_post`, `add_merchant_whatsapp`.

Ao adicionar uma tool nova: crie o arquivo em `src/lib/mcp/tools/`, importe em `src/lib/mcp/index.ts`, e sinalize no PR pra fazer o deploy da function `mcp`.

---

## 6. Comandos úteis

```bash
npm install              # instalar deps
npm run dev              # dev server em http://localhost:8080
npm run build            # build de produção (regenera supabase/functions/mcp)
npm run lint             # eslint

# Supabase local (opcional)
supabase functions serve <nome> --no-verify-jwt
supabase db push
```

---

## 7. Fluxo de trabalho recomendado

1. Rode `npm install` e `npm run dev` — confirme que o preview sobe.
2. Antes de mexer, leia o arquivo alvo inteiro. Não pressuma padrão.
3. Mudanças pequenas e focadas por commit — o Lovable puxa cada push automaticamente.
4. Migration nova? Sempre GRANT + RLS na mesma migration.
5. Nunca commite `.env`, chaves, tokens.
6. Depois do push, o preview em `https://clilin.com` é atualizado após "Publish" no Lovable — mudanças de código sincronizam automaticamente mas a publicação em produção é manual.

---

## 8. Coisas que EU (Claude Code) NÃO devo fazer

- Editar `src/integrations/supabase/client.ts` ou `types.ts` (auto-gerado — vai ser sobrescrito).
- Editar `supabase/functions/mcp/index.ts` (gerado pelo Vite plugin).
- Editar `supabase/config.toml`.
- Trocar "divulgadores" por "afiliados".
- Adicionar terminologia religiosa explícita (a mensagem é universal: servir, conectar, crescer).
- Hardcode de cores fora dos tokens em `index.css`.
- Criar tabela sem GRANT + RLS.
- Guardar role no `profiles`.

---

Qualquer dúvida sobre intenção de negócio, **pergunte antes** — o dono do projeto é o `@JoaoClilin` (admin do repo).
