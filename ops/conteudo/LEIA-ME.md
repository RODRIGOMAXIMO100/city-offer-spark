# Máquina de conteúdo do Clilin (@clilin.oficial)

Roda na VPS a partir de `/opt/clilin/app/ops/conteudo` (o deploy do site já puxa esta pasta).

- Todo dia o Claude escreve 1 carrossel e 1 reels, o script desenha as lâminas e o vídeo
  (voz ElevenLabs + trilha do Vídeos PRO) e publica no Instagram e na página do Facebook.
- Chaves: lidas de `/opt/maximo-shorts/.env` (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, IG_TOKEN) e de
  `/opt/clilin/conteudo/.env` (CLILIN_IG_USER_ID, CLILIN_FB_PAGE). Nada de chave neste repositório.
- Arquivos de trabalho em `/opt/clilin/conteudo/itens`; o que vai para a Meta fica público em
  `https://clilin.com/media/conteudo`.
- Fontes Unbounded e Onest (licença OFL) e o logo de 3 Cs ficam em `assets/`.

Comandos: `rodar`, `postar carrossel|reel`, `agora [carrossel|reel]`, `status`.
