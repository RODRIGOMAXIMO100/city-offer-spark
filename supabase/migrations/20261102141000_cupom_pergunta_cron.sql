-- Pergunta "Você foi atendido?" ao cliente no WhatsApp (edge function cupom-pergunta), a cada 15 minutos.
insert into private.app_secrets (name, value)
select 'cupom_cron', encode(extensions.gen_random_bytes(32), 'hex')
where not exists (select 1 from private.app_secrets where name = 'cupom_cron');

select cron.unschedule('cupom-pergunta') where exists (select 1 from cron.job where jobname = 'cupom-pergunta');
select cron.schedule('cupom-pergunta', '*/15 * * * *', $cron$
  select net.http_post(
    url := 'https://pcqbecmkqpwnxepwnmdl.supabase.co/functions/v1/cupom-pergunta',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-secret', (select value from private.app_secrets where name = 'cupom_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
$cron$);
