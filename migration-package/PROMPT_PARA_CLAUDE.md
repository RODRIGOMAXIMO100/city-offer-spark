# Runbook de migração do Clilin para um Supabase externo

> Cole este arquivo (ou o link dele no repo) para o Claude. Ele tem acesso ao repositório
> via GitHub e ao Supabase via MCP/Management API na conta dona do projeto novo.
> **Execute na ordem. Não pule etapas.**

---

## 0. Contexto

- App: **Clilin** — plataforma de ofertas locais (Empresas / Divulgadores / Clientes / Admin).
- Stack: Vite + React 18 + TS + Tailwind + shadcn/ui; backend Supabase (Postgres + Auth + Edge Functions Deno).
- Origem: projeto gerenciado (Lovable Cloud), ref `sukvjgxxuzophzjcojvd`.
- Destino: **projeto Supabase novo, na organização do usuário** (ele é Owner → sem 403).
- Todo o material já está exportado em `migration-package/`:

```
migration-package/
  01_schema.sql              # schema completo: enums, tabelas, GRANTs, RLS, funções
  02_dados/*.csv             # dump de 30 tabelas + _auth_users_referencia.csv
  03_edge_functions/         # código das 27 edge functions
  04_INSTRUCOES.md           # passo a passo original
  PROMPT_PARA_CLAUDE.md      # este arquivo
```

Regras do projeto (leia `CLAUDE.md` na raiz antes de mexer em código):
- Dinheiro sempre em **centavos** (integer).
- Role **nunca** no `profiles` — sempre `public.user_roles` + `has_role()` SECURITY DEFINER.
- Toda tabela em `public` precisa de `GRANT` + `ENABLE RLS` + policies **na mesma migration**.
- Nunca editar `src/integrations/supabase/client.ts`, `types.ts`, `supabase/config.toml`, `supabase/functions/mcp/index.ts`.
- UI diz **"divulgadores"**, nunca "afiliados".

---

## 1. Criar o projeto de destino

1. Crie o projeto Supabase na organização do usuário (região `sa-east-1` / São Paulo).
2. Anote e guarde em local seguro:
   - `PROJECT_REF`
   - `SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
   - `ANON/PUBLISHABLE KEY`
   - `SERVICE_ROLE_KEY` — **nunca** commitar, nunca no frontend, nunca em build secret. Só em edge function.
3. Confirme que `supabase projects list` mostra o projeto novo (se não mostrar, o token está em outra conta — pare aqui).

---

## 2. Schema

```bash
psql "$DATABASE_URL_DESTINO" -f migration-package/01_schema.sql
```

Depois valide:

```sql
-- Toda tabela public precisa ter RLS ligado
SELECT tablename FROM pg_tables
WHERE schemaname='public' AND NOT rowsecurity;   -- deve voltar 0 linhas

-- Toda tabela precisa de pelo menos 1 policy
SELECT t.tablename FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename=t.tablename AND p.schemaname='public'
WHERE t.schemaname='public' GROUP BY t.tablename HAVING count(p.policyname)=0;
```

Se alguma tabela aparecer, **não siga** — corrija a policy antes de importar dados.

### Decisão obrigatória antes de importar: `admin_exec_sql`

O schema inclui `public.admin_exec_sql(p_sql text)`, que executa **SQL arbitrário** no banco
(protegida por `has_role(auth.uid(),'ADMIN')`) e é exposta pela tool `execute_sql` do MCP.
No projeto novo, com Owner + MCP, o comprometimento de uma sessão admin vira controle total
(inclusive `DROP TABLE`). Pergunte ao usuário: manter, restringir a `SELECT`, ou remover.
Se ele não responder, **mantenha como está** e registre a pendência — não decida sozinho.

---

## 3. Auth (fazer ANTES dos dados)

Os CSVs **não contêm** `auth.users`. `02_dados/_auth_users_referencia.csv` é só referência
(id + email), sem hash de senha. Sem migrar `auth.users`, **todo mundo perde o login** e as
FKs de `profiles.user_id` ficam órfãs.

Ordem:

1. Exporte `auth.users` da origem preservando `id`, `email`, `encrypted_password`,
   `email_confirmed_at`, `raw_user_meta_data`, `created_at`.
   - Sem acesso admin à origem, a alternativa é forçar reset de senha para todos
     — decisão do usuário, confirme antes.
2. Importe no destino **mantendo os mesmos UUIDs** (`profiles.user_id`, `user_roles.user_id`,
   `withdrawals.reviewed_by`, `fraud_alerts.resolved_by` etc. dependem disso).
3. Configure providers: **Email/Senha** + **Google**.
4. Redirect URLs: `https://clilin.com/auth/callback`, `https://www.clilin.com/auth/callback`,
   e a URL de preview do Lovable.
5. Site URL: `https://clilin.com`.
6. Ative **Leaked password protection (HIBP)**.
7. **Não** ative confirmação automática de e-mail e **não** habilite signup anônimo.

Valide: `SELECT count(*) FROM auth.users;` deve bater com a origem.

---

## 4. Dados

Importe nesta ordem (respeita FKs):

```
1. niches, affiliate_levels, pricing_config, available_cities, site_pages, blog_themes
2. profiles, user_roles
3. offers, merchant_whatsapp, short_links
4. offer_clicks, offer_views, offer_scores, leads, page_sessions
5. coupons, invoices, transactions, payments, withdrawals
6. affiliate_stats, affiliate_monthly_history, user_onboarding, notifications
7. fraud_alerts, fraud_blacklist, user_bans, device_fingerprints
8. blog_posts, city_waitlist
```

Depois de importar, resete as sequences/contadores e recalcule:

```sql
SELECT public.recalculate_all_affiliate_stats();
SELECT public.recalculate_all_offer_scores();
SELECT public.update_ranking_positions();
```

Validação: compare `count(*)` de cada tabela com a origem antes de considerar a etapa concluída.

---

## 5. Storage

Buckets da origem: `offer-images`, `company-avatars`, `static-files` — **todos públicos hoje**.

1. Crie os 3 buckets no destino.
2. Recomendação: manter público só o que é realmente público (imagens de oferta, avatar de
   empresa). `static-files` deve ser avaliado — se tiver qualquer arquivo com dado de usuário,
   crie como **privado** e sirva por signed URL.
3. Copie os arquivos (baixar da origem → upload no destino) preservando os caminhos, senão
   as URLs salvas em `offers.images` e `profiles.avatar_url` quebram.
4. Recrie as policies de `storage.objects`: upload restrito ao dono
   (`auth.uid()` = pasta do usuário), leitura conforme a visibilidade do bucket.

---

## 6. Secrets das edge functions

Recriar no projeto novo (valores vêm do usuário — **não invente placeholders**):

```
WA_TOKEN, WA_PHONE_NUMBER_ID, WA_BUSINESS_ACCOUNT_ID, WA_VERIFY_TOKEN, WA_APP_SECRET
ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN, ASAAS_SANDBOX
IPINFO_API_KEY, TURNSTILE_SECRET_KEY
GOOGLE_SEARCH_CONSOLE_API_KEY
GITHUB_TOKEN, GITHUB_REPO
LOVABLE_API_KEY        (se for continuar usando o AI Gateway do Lovable)
SB_PROJECT_REF         (= PROJECT_REF novo)
SB_MGMT_ACCESS_TOKEN   (token da conta dona do projeto novo)
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` são injetados
automaticamente pelo runtime — não crie manualmente.

Checklist de segurança nesta etapa:
- `SUPABASE_SERVICE_ROLE_KEY` só dentro de edge function. Nunca em `.env` do front,
  nunca em variável `VITE_*`, nunca logada.
- `GITHUB_TOKEN` e `SB_MGMT_ACCESS_TOKEN` dão escrita no repo e deploy em produção.
  Use tokens **fine-grained**, escopo mínimo, e só se o MCP for continuar exposto ao Claude.

---

## 7. Edge Functions

```bash
supabase link --project-ref <PROJECT_REF>
for f in supabase/functions/*/; do
  n=$(basename "$f"); [ "$n" = "_shared" ] && continue
  supabase functions deploy "$n"
done
```

Regras ao revisar cada function antes do deploy:
- CORS em **todas** as respostas, inclusive erro.
- JWT validado no código (`supabase.auth.getClaims`) — a maioria roda com `verify_jwt = false`.
- Input validado com Zod, 400 com mensagem clara.
- Nada de SQL arbitrário via `execute_sql` dentro de function.

Webhooks que precisam de reconfiguração de URL no provedor:
- **WhatsApp Cloud API** → `.../functions/v1/wa-webhook` (reconfigurar callback + verify token).
- **Asaas** → `.../functions/v1/asaas-webhook`.
- **MCP** → `.../functions/v1/mcp` (o conector no Claude precisa ser reapontado e reautorizado).

---

## 8. Frontend

1. Atualizar `.env` (e as env vars do build):
   ```
   VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key novo>
   VITE_SUPABASE_PROJECT_ID=<PROJECT_REF>
   ```
2. `grep -rn "sukvjgxxuzophzjcojvd" src/ supabase/ public/ index.html` — não pode sobrar nenhuma
   referência hardcoded ao projeto antigo.
3. Regenerar `src/integrations/supabase/types.ts` contra o banco novo.
4. `npm run build` — o build regenera `supabase/functions/mcp/index.ts` a partir de `src/lib/mcp/`.
5. Commitar. O Lovable sincroniza; a publicação em produção é manual (botão Publish).

---

## 9. Smoke test antes de virar a chave

Rode cada um logado com o papel correspondente:

- [ ] Login e-mail/senha + login Google
- [ ] Signup de empresa, divulgador e cliente (com validação de cidade disponível)
- [ ] Criar oferta (empresa) e ver na home
- [ ] Gerar lead → `process-lead` credita centavos certos
- [ ] Emitir cupom (`issue-coupon`) → chega WhatsApp
- [ ] Resgatar cupom (`redeem-coupon` → `settle_redemption`) nos dois modos PRE e POS
- [ ] Depósito Asaas (mínimo **R$ 100**) e webhook confirmando
- [ ] Saque: `request-withdrawal` + aprovação admin
- [ ] Admin: cidades, SEO, templates WhatsApp
- [ ] Blog: `generate-blog-post` + `publish-scheduled-posts`
- [ ] MCP no Claude: reconectar e rodar `whoami` + `admin_overview`

Só depois de tudo verde: apontar `clilin.com` para o build novo.

---

## 10. Pós-migração

- Rodar o linter do Supabase e resolver o que for de RLS/policies.
- **Rotacionar** todas as chaves do projeto antigo (anon, service role, e os secrets de
  terceiros que ficaram nos dois lugares).
- Manter o projeto antigo **em leitura**, sem tráfego, por ~30 dias como rollback.
- Não apagar nada antes de 2 backups verificados do banco novo.

---

## Erros comuns

| Sintoma | Causa provável |
|---|---|
| `permission denied for table X` | faltou `GRANT` na tabela — RLS sozinho não basta |
| Usuário loga mas não tem perfil | `auth.users` importado com UUID diferente do `profiles.user_id` |
| Imagem de oferta quebrada | arquivos do storage copiados com caminho diferente |
| `Unsupported provider` no Google | provider não configurado no projeto novo |
| Webhook WhatsApp em silêncio | `WA_VERIFY_TOKEN` diferente do configurado na Meta |
| 403 no deploy | token pertence a conta sem acesso à org do projeto |
