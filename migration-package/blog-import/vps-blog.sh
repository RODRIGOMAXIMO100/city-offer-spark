#!/usr/bin/env bash
# Roda na VPS: copia as imagens do blog antigo e liga /media, /sitemap-blog.xml e /rss.xml no nginx.
set -euo pipefail
RAW=https://raw.githubusercontent.com/RODRIGOMAXIMO100/city-offer-spark/feat/site-completo/migration-package/blog-import
DIR=/opt/clilin/media/blog
mkdir -p "$DIR"
cd "$DIR"
curl -sf "$RAW/imagens.txt" | grep -v '^$' | xargs -P 8 -I{} sh -c 'f=$(basename "{}"); [ -s "$f" ] || curl -sf -o "$f" "{}" || echo "FALHOU $f"'
echo "IMAGENS: $(ls | wc -l) arquivos, $(du -sh . | cut -f1)"

CONF=/etc/nginx/sites-available/clilin
if ! grep -q "location ^~ /media/" "$CONF"; then
  cp "$CONF" "$CONF.bak-$(date +%s)"
  python3 - "$CONF" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
block='''    location ^~ /media/ {
        alias /opt/clilin/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
    location = /sitemap-blog.xml {
        proxy_pass https://pcqbecmkqpwnxepwnmdl.supabase.co/functions/v1/sitemap-blog;
        proxy_set_header Host pcqbecmkqpwnxepwnmdl.supabase.co;
        proxy_ssl_server_name on;
    }
    location = /rss.xml {
        proxy_pass https://pcqbecmkqpwnxepwnmdl.supabase.co/functions/v1/rss;
        proxy_set_header Host pcqbecmkqpwnxepwnmdl.supabase.co;
        proxy_ssl_server_name on;
    }
'''
i=s.index("    location / {")
s=s[:i]+block+s[i:]
open(p,"w").write(s)
PY
fi
nginx -t && systemctl reload nginx
sleep 1
F=$(ls "$DIR" | head -1)
echo "MEDIA: $(curl -s -o /dev/null -w '%{http_code}' --resolve clilin.com:443:127.0.0.1 https://clilin.com/media/blog/$F)"
echo "SITEMAP: $(curl -s --resolve clilin.com:443:127.0.0.1 https://clilin.com/sitemap-blog.xml | grep -c '<loc>') urls"
echo "RSS: $(curl -s --resolve clilin.com:443:127.0.0.1 https://clilin.com/rss.xml | grep -c '<item>') itens"
echo VPS_BLOG_OK
