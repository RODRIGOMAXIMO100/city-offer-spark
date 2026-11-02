-- Cliente avisa que vai usar o cupom ("Estou na loja" ou "Pedir online"), pelo WhatsApp ou pela
-- página do cupom no site. A loja vê na hora (painel e WhatsApp) e confirma com um toque.
alter table public.coupons
  add column if not exists uso_solicitado_em timestamptz,
  add column if not exists uso_canal text,
  add column if not exists uso_origem text,
  add column if not exists loja_avisada_em timestamptz;

do $$ begin
  alter table public.coupons add constraint coupons_uso_canal_chk check (uso_canal is null or uso_canal in ('loja', 'online'));
exception when duplicate_object then null; end $$;

create index if not exists coupons_uso_solicitado_idx
  on public.coupons (company_id, uso_solicitado_em desc)
  where status = 'ISSUED' and uso_solicitado_em is not null;
