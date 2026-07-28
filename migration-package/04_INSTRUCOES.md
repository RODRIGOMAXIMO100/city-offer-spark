# Pacote de migração do Clilin

Gerado a partir do backend atual. Use isto para subir o Clilin em um projeto Supabase da sua conta (org PRONTHA).

## Conteúdo

| Arquivo | O que é |
|---|---|
| `01_schema.sql` | Schema completo: tabelas, enums, GRANTs, RLS, policies, ~40 functions e triggers. É a concatenação ordenada das 66 migrations do projeto. |
| `02_dados/*.csv` | Dados de negócio, uma tabela por CSV, com header. |
| `03_edge_functions/` | Código-fonte das 26 edge functions (a função `mcp` fica de fora: ela é gerada pelo build do Vite). |

## Ordem de execução

### 1. Schema
No SQL Editor do projeto novo, rode `01_schema.sql` inteiro, de uma vez. Ele é idempotente na maior parte, mas foi feito para rodar em banco limpo.

### 2. Usuários do Auth
Os hashes de senha vivem no schema `auth`, que é gerenciado e não pode ser lido daqui (a leitura foi negada por permissão). Dois caminhos:

- **Manter senhas:** abrir ticket no suporte Supabase pedindo o export dos usuários (com hashes) do projeto atual para importar no novo.
- **Sem ticket:** recriar os usuários pela Admin API (`auth.admin.createUser`) usando os e-mails da tabela `profiles` e disparar reset de senha. Login por Google continua funcionando sem fricção.

**Importante:** os `user_id` de `profiles` e `user_roles` referenciam `auth.users`. Importe os usuários **antes** dos CSVs, mantendo os mesmos UUIDs — senão as FKs quebram.

### 3. Dados
Importe os CSVs nesta ordem (respeita as dependências):

```
affiliate_levels, niches, pricing_config, available_cities, site_pages, blog_themes, blog_posts
profiles, user_roles, user_onboarding
offers, offer_scores, offer_views, offer_clicks
leads, coupons, invoices, transactions, short_links
affiliate_stats, affiliate_monthly_history, notifications
merchant_whatsapp, payments, withdrawals
city_waitlist, user_bans, fraud_alerts, fraud_blacklist, device_fingerprints
```

Volumes atuais: 5.571 cidades, 307 posts, 656 scores, 120 temas, 34 nichos, 27 transações, 8 perfis, 5 ofertas.

### 4. Storage
Criar os 3 buckets públicos e reenviar os arquivos:
- `offer-images`
- `company-avatars`
- `static-files`

Depois de criar, reaplicar as policies de storage que estão no final do `01_schema.sql`.

### 5. Edge functions
Deploy das 26 funções de `03_edge_functions/`. A função `mcp` é regenerada pelo `npm run build` (plugin do Vite) — não copie o arquivo gerado.

### 6. Secrets a recadastrar
Você precisa ter esses valores em mãos (não são legíveis daqui):

```
ASAAS_API_KEY
ASAAS_WEBHOOK_TOKEN
ASAAS_SANDBOX
WA_TOKEN
WA_APP_SECRET
WA_VERIFY_TOKEN
WA_PHONE_NUMBER_ID
WA_BUSINESS_ACCOUNT_ID
TURNSTILE_SECRET_KEY
IPINFO_API_KEY
LOVABLE_API_KEY
```

Os `SUPABASE_*` são preenchidos automaticamente pelo projeto novo.

### 7. URLs para reapontar depois da virada

| Onde | O que muda |
|---|---|
| Painel Asaas | webhook → `https://<novo-ref>.supabase.co/functions/v1/asaas-webhook` |
| Meta / WhatsApp Cloud API | webhook → `https://<novo-ref>.supabase.co/functions/v1/wa-webhook` (mesmo `WA_VERIFY_TOKEN`) |
| Google Cloud Console | redirect URI → `https://<novo-ref>.supabase.co/auth/v1/callback` |
| Supabase Auth → URL Config | Site URL `https://clilin.com` + redirects `https://clilin.com/**` |
| Claude / MCP | issuer novo em `src/lib/mcp/index.ts` vem de `VITE_SUPABASE_PROJECT_ID`; basta rebuildar e reconectar em `/.lovable/oauth/consent` |

### 8. Checklist final
- [ ] Habilitar provider Google no Auth
- [ ] Habilitar leaked password protection
- [ ] Conferir que RLS está ativa em todas as 39 tabelas
- [ ] Rodar `select public.recalculate_all_affiliate_stats();` e `select public.recalculate_all_offer_scores();`
- [ ] Testar: signup, publicar oferta, gerar cupom, resgatar cupom, webhook Asaas
