-- Blog automático: 1 post por dia (edge function blog-diario), às 08h07 de Brasília.
insert into private.app_secrets (name, value)
select 'blog_cron', encode(extensions.gen_random_bytes(32), 'hex')
where not exists (select 1 from private.app_secrets where name = 'blog_cron');

select cron.unschedule('blog-diario') where exists (select 1 from cron.job where jobname = 'blog-diario');
select cron.schedule('blog-diario', '7 11 * * *', $cron$
  select net.http_post(
    url := 'https://pcqbecmkqpwnxepwnmdl.supabase.co/functions/v1/blog-diario',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-secret', (select value from private.app_secrets where name = 'blog_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
$cron$);
