#!/usr/bin/env python3
"""Máquina de conteúdo do Instagram e Facebook do Clilin (@clilin.oficial).

Todo dia: 1 carrossel e 1 reels. O Claude escreve, este script desenha as
lâminas e o vídeo (narração ElevenLabs + trilha), e publica direto pela API da
Meta, no mesmo esquema das máquinas da MAXIMO que rodam neste servidor.

uso:
  clilin_conteudo.py rodar                 escreve e renderiza o carrossel e o reels do dia
  clilin_conteudo.py postar carrossel|reel publica o próximo pronto daquele tipo
  clilin_conteudo.py agora [carrossel|reel] escreve, renderiza e publica na hora
  clilin_conteudo.py escrever carrossel|reel
  clilin_conteudo.py render ID
  clilin_conteudo.py status
  clilin_conteudo.py pagina                 arruma a página do Facebook (foto, capa, sobre, site)

Chaves (nunca impressas): lidas de /opt/maximo-shorts/.env e, por cima,
de /opt/clilin/conteudo/.env (CLILIN_IG_USER_ID, CLILIN_FB_PAGE, CONTEUDO_MODEL,
TTS_VOZ, TTS_MODEL).
"""
import datetime
import fcntl
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = f"{AQUI}/assets"
BASE = os.environ.get("CLILIN_CONTEUDO", "/opt/clilin/conteudo")
ITENS = f"{BASE}/itens"
MEDIA = os.environ.get("CLILIN_MEDIA", "/opt/clilin/media/conteudo")
URL = os.environ.get("CLILIN_MEDIA_URL", "https://clilin.com/media/conteudo")
TRILHAS = os.environ.get("CLILIN_TRILHAS", "/opt/maximo-shorts/videospro/trilhas")
G = "https://graph.facebook.com/v23.0"

# Identidade do Clilin (o violeta nunca aparece sozinho: sempre com rosa e laranja)
VIOLETA = (107, 44, 216)
ROSA = (244, 37, 120)
LARANJA = (255, 159, 26)
ESCURO = (23, 10, 46)
CLARO = (251, 248, 255)
CINZA = (92, 84, 112)
BRANCO = (255, 255, 255)
GRADIENTES = [(VIOLETA, ROSA), (ROSA, LARANJA), (VIOLETA, LARANJA), (ESCURO, VIOLETA)]

TZ = datetime.timezone(datetime.timedelta(hours=-3))
PAUTAS = ["empresas", "divulgadores", "clientes"]


# ---------------------------------------------------------------- utilidades
def env():
    e = dict(os.environ)
    for arq in ("/opt/maximo-shorts/.env", f"{BASE}/.env"):
        if os.path.exists(arq):
            for ln in open(arq, encoding="utf-8"):
                if "=" in ln and not ln.lstrip().startswith("#"):
                    k, v = ln.strip().split("=", 1)
                    e[k.strip()] = v.strip().strip('"').strip("'")
    return e


def agora():
    return datetime.datetime.now(TZ)


def log(*a):
    print(agora().strftime("%d/%m %H:%M"), *a, flush=True)


def limpa(s):
    return re.sub(r"(EAA|IGA|sk-ant-)[A-Za-z0-9_-]{8,}", "(oculto)", str(s))


def trava(nome):
    os.makedirs(BASE, exist_ok=True)
    f = open(f"/tmp/clilin_conteudo_{nome}.lock", "w")
    try:
        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        sys.exit(f"{nome} já está rodando")
    return f


def ler(item_id, nome="item.json", padrao=None):
    p = f"{ITENS}/{item_id}/{nome}"
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else padrao


def gravar(item_id, dados, nome="item.json"):
    os.makedirs(f"{ITENS}/{item_id}", exist_ok=True)
    json.dump(dados, open(f"{ITENS}/{item_id}/{nome}", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def estado(item_id):
    return ler(item_id, "estado.json", {"estado": "novo"})


def marca(item_id, **kw):
    e = estado(item_id)
    e.update(kw)
    e["atualizado"] = agora().isoformat(timespec="seconds")
    gravar(item_id, e, "estado.json")
    return e


def itens(tipo=None):
    if not os.path.isdir(ITENS):
        return []
    out = []
    for d in sorted(os.listdir(ITENS)):
        it = ler(d)
        if it and (tipo is None or it.get("tipo") == tipo):
            out.append(d)
    return out


def sem_travessao(s):
    # regra da casa: nada de travessão nos textos
    return re.sub(r"\s*[—–]\s*", ", ", s or "").replace(" ,", ",").strip()


# ---------------------------------------------------------------- escrita (Claude)
REGRAS = """Você escreve o conteúdo do Instagram do Clilin (@clilin.oficial), em português do Brasil.

O QUE É O CLILIN
- Plataforma de ofertas locais: negócios da cidade publicam promoções, divulgadores espalham e o cliente pega o cupom de graça, direto no WhatsApp.
- O cliente mostra o código na loja ou manda no WhatsApp da loja. Quando alguém pega o cupom, a loja recebe um aviso no WhatsApp e, quando o cliente chega, confirma o uso com um toque no botão "Confirmar uso", sem digitar código nem entrar em outro sistema (o painel continua como opção). Cada cupom vale uma vez.
- A loja só paga pelo cupom usado: 15% do preço da oferta, mínimo de R$ 3. Sem mensalidade. Visita e cupom não usado não custam nada. Com saldo pré-pago, 10% de desconto.
- Divulgador: indica as ofertas da cidade pelo próprio link e ganha metade da taxa de cada cupom usado por quem veio do link dele, chegando a 70% conforme o nível. Saque por Pix a partir de R$ 100. Cadastro grátis, não precisa ter muitos seguidores.
- Cliente: grátis, sem app e sem cadastro.
- Ofertas separadas por cidade. O Clilin está começando por Belo Horizonte (MG): o cadastro de empresas e divulgadores está aberto em BH, e quem é de outra cidade faz o pré-cadastro. Pode falar de BH e dos bairros de BH. Site: clilin.com (ofertas em clilin.com/ofertas). O Clilin é um produto do Grupo MAXIMO.

PÚBLICOS (a pauta do dia diz qual)
- empresas: donos de restaurante, salão, academia, loja, pizzaria, açaí, pet shop etc. Dores: movimento fraco, gastar com anúncio sem saber se voltou cliente, promoção que não traz gente nova, cliente que não volta.
- divulgadores: quem quer renda extra indicando ofertas da cidade para grupos, status e contatos.
- clientes: quem quer economizar na própria cidade e descobrir lugares.

TOM
- Direto, popular, brasileiro, prático. Frases curtas. Pode ter humor leve.
- Afirme o que é bom; não abra levantando objeção ("tem gente que acha que...").
- NUNCA use travessão (— ou –). Use vírgula, ponto ou dois-pontos.
- Use "divulgadores", nunca "afiliados". Nada de termo religioso.
- Não invente números, estatísticas, clientes, cidades com ofertas ou depoimentos. Exemplos de loja são hipotéticos e genéricos ("uma pizzaria", "um salão").
- Não prometa resultado garantido.
- Chamada final leva para clilin.com ou para o link da bio.

Responda SOMENTE com o JSON pedido, sem markdown."""

FORMATO = {
    "carrossel": """Escreva UM carrossel. JSON:
{"titulo_interno": "resumo de 5 a 8 palavras",
 "legenda": "legenda do post, 2 a 5 frases curtas, termina com chamada para clilin.com ou link da bio",
 "hashtags": ["até 5 hashtags sem espaço, começando com #"],
 "laminas": [{"titulo": "...", "texto": "..."}]}
Regras das lâminas: 6 a 8 lâminas. A 1ª é a capa: título forte de até 8 palavras que prende a atenção, texto de até 12 palavras.
As do meio: título de até 7 palavras e texto de até 32 palavras, uma ideia por lâmina, prática.
A última é a chamada: título de até 6 palavras e texto de até 20 palavras levando para clilin.com.""",
    "reel": """Escreva UM reels de 30 a 40 segundos com motion, narrado por uma voz feminina. JSON:
{"titulo_interno": "resumo de 5 a 8 palavras",
 "legenda": "legenda do post, 2 a 4 frases curtas, termina com chamada para clilin.com ou link da bio",
 "hashtags": ["até 5 hashtags sem espaço, começando com #"],
 "oferta": {"loja": "nome genérico e inventado de negócio local, ex.: Pizzaria do Bairro", "titulo": "oferta de até 4 palavras",
            "de": 59, "por": 39, "cidade": "Sua cidade"},
 "cenas": [{"tipo": "...", "fala": "...", "...": "campos do tipo"}]}
Tipos de cena:
- "gancho": abre o vídeo e prende nos 2 primeiros segundos. "texto": até 6 palavras grandes na tela. "destaque": 1 ou 2 palavras do texto para colorir. "rotulo": selo de até 4 palavras dizendo para quem é (ex.: "Para quem tem negócio").
- "frase": a própria fala aparece grande na tela, palavra por palavra. "destaque": 1 ou 2 palavras da fala. "rotulo": opcional.
- "celular": mostra o Clilin de verdade num celular. "tela" é uma destas: "ofertas" (cliente vendo as ofertas da cidade), "oferta" (cliente toca em Quero meu cupom e o código aparece), "whatsapp" (o cupom chegando no WhatsApp), "confirmar" (a loja recebe o aviso do cupom no WhatsApp e confirma o uso com um toque), "divulgador" (divulgador copia o link da oferta e manda nos grupos). "texto": título de até 6 palavras acima do celular. "destaque": 1 ou 2 palavras do texto.
- "numero": número grande animado. "valor": só o número; "prefixo" (ex.: "R$ ") e "sufixo" (ex.: "%"); "texto": até 10 palavras explicando; "rotulo": opcional. Só números verdadeiros do Clilin: 15% do preço por cupom usado, mínimo de R$ 3, 10% de desconto no pré-pago, 50% da taxa para o divulgador (até 70% conforme o nível), saque a partir de R$ 100.
- "lista": "texto": título de até 4 palavras; "itens": 2 a 4 itens de até 4 palavras cada.
- "cta": a última cena. "texto": até 6 palavras; "destaque"; "url": "clilin.com"; "rotulo": "link na bio".
Regras: 7 a 10 cenas. A 1ª é "gancho" e a última é "cta". Use 3 ou 4 cenas "celular" com telas diferentes que façam sentido para a pauta (empresas: oferta, whatsapp, confirmar; divulgadores: divulgador, oferta, whatsapp; clientes: ofertas, oferta, whatsapp). Varie a ordem e use pelo menos uma "frase".
"fala": curta e natural de falar em voz alta (até 18 palavras por cena), somando 70 a 100 palavras no vídeo todo. Valores por extenso do jeito que se fala ("quinze por cento", "três reais"). O texto da tela combina com a fala, mas é mais curto.""",
}


def claude(e, msgs, max_tokens=4000):
    key = e.get("ANTHROPIC_API_KEY")
    if not key:
        sys.exit("ERRO: falta ANTHROPIC_API_KEY")
    hd = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}

    def api(path, body=None):
        r = urllib.request.Request("https://api.anthropic.com" + path, data=json.dumps(body).encode() if body else None,
                                   headers=hd, method="POST" if body else "GET")
        try:
            return json.loads(urllib.request.urlopen(r, timeout=300).read())
        except urllib.error.HTTPError as x:
            sys.exit("ERRO api " + str(x.code) + " " + limpa(x.read()[:300].decode("utf-8", "replace")))

    mod = e.get("CONTEUDO_MODEL") or next((i["id"] for i in api("/v1/models?limit=50").get("data", []) if "sonnet" in i["id"]), None)
    r = api("/v1/messages", {"model": mod, "max_tokens": max_tokens, "system": REGRAS, "messages": msgs})
    txt = "".join(c.get("text", "") for c in r.get("content", []))
    u = r.get("usage", {})
    usd = (u.get("input_tokens", 0) * 3 + u.get("output_tokens", 0) * 15) / 1e6
    return txt, mod, usd


def valida(tipo, c):
    if not isinstance(c, dict):
        return "não é objeto"
    if not c.get("legenda"):
        return "sem legenda"
    if tipo == "carrossel":
        ls = c.get("laminas") or []
        if not 5 <= len(ls) <= 9:
            return f"{len(ls)} lâminas"
        if any(not (l.get("titulo") and l.get("texto")) for l in ls):
            return "lâmina sem título ou texto"
    else:
        cs = c.get("cenas") or []
        if not 6 <= len(cs) <= 11:
            return f"{len(cs)} cenas"
        tipos = {"gancho", "frase", "celular", "numero", "lista", "cta"}
        if any(s.get("tipo") not in tipos or not s.get("fala") for s in cs):
            return "cena sem tipo válido ou sem fala"
        if cs[0]["tipo"] != "gancho" or cs[-1]["tipo"] != "cta":
            return "a 1ª cena tem que ser gancho e a última cta"
        if any(s["tipo"] == "celular" and s.get("tela") not in ("ofertas", "oferta", "whatsapp", "confirmar", "validar", "divulgador") for s in cs):
            return "cena celular com tela inválida"
        if any(s["tipo"] == "numero" and not isinstance(s.get("valor"), (int, float)) for s in cs):
            return "cena numero sem valor numérico"
        if any(s["tipo"] in ("gancho", "celular", "cta") and not s.get("texto") for s in cs):
            return "cena sem texto de tela"
        n = sum(len(s["fala"].split()) for s in cs)
        if not 60 <= n <= 115:
            return f"{n} palavras de narração"
    return None


def limpa_textos(c):
    def fx(v):
        if isinstance(v, str):
            return sem_travessao(v)
        if isinstance(v, list):
            return [fx(x) for x in v]
        if isinstance(v, dict):
            return {k: fx(x) for k, x in v.items()}
        return v
    return fx(c)


def escrever(tipo):
    e = env()
    hoje = agora()
    n = int(hoje.strftime("%j")) + (0 if tipo == "carrossel" else 1)
    pautas = [p.strip() for p in (e.get("CONTEUDO_PAUTAS") or ",".join(PAUTAS)).split(",") if p.strip() in PAUTAS] or PAUTAS
    pauta = pautas[n % len(pautas)]
    usados = []
    for d in itens(tipo)[-30:]:
        it = ler(d)
        usados.append(it.get("titulo_interno", ""))
    pedido = (f"Pauta de hoje: {pauta}.\n" + FORMATO[tipo] +
              ("\n\nJá saíram estes temas, NÃO repita nem chegue perto:\n- " + "\n- ".join(u for u in usados if u) if usados else ""))
    msgs = [{"role": "user", "content": pedido}]
    custo = 0.0
    for tent in range(3):
        txt, mod, usd = claude(e, msgs)
        custo += usd
        m = re.search(r"\{[\s\S]*\}", txt)
        try:
            c = json.loads(m.group(0)) if m else None
        except json.JSONDecodeError:
            c = None
        erro = valida(tipo, c) if c else "não veio JSON"
        if not erro:
            break
        log("escrita recusada:", erro, "tentando de novo")
        msgs += [{"role": "assistant", "content": txt}, {"role": "user", "content": f"Corrija: {erro}. Devolva o JSON inteiro de novo."}]
    else:
        sys.exit(f"ERRO: não consegui escrever o {tipo}")
    c = limpa_textos(c)
    item_id = hoje.strftime("%Y%m%d-%H%M%S") + "-" + tipo[:3]
    c.update({"id": item_id, "tipo": tipo, "pauta": pauta, "modelo": mod, "custo_usd": round(custo, 4),
              "criado": hoje.isoformat(timespec="seconds"), "estilo": random.randrange(len(GRADIENTES))})
    gravar(item_id, c)
    marca(item_id, estado="escrito")
    log("escrito", item_id, pauta, "|", c.get("titulo_interno"), f"| US$ {custo:.3f}")
    return item_id


# ---------------------------------------------------------------- desenho
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

_FONTES = {}


def fonte(familia, peso, tam):
    k = (familia, peso, tam)
    if k not in _FONTES:
        f = ImageFont.truetype(f"{ASSETS}/{familia}.ttf", tam)
        try:
            f.set_variation_by_axes([peso])
        except Exception:
            pass
        _FONTES[k] = f
    return _FONTES[k]


def titulo_f(tam, peso=800):
    return fonte("Unbounded", peso, tam)


def texto_f(tam, peso=500):
    return fonte("Onest", peso, tam)


def quebra(d, txt, f, maxw):
    linhas = []
    for par in (txt or "").split("\n"):
        cur = ""
        for w in par.split():
            t = (cur + " " + w).strip()
            if d.textlength(t, font=f) <= maxw:
                cur = t
            else:
                if cur:
                    linhas.append(cur)
                cur = w
        linhas.append(cur)
    return [l for l in linhas if l is not None]


def cabe(d, txt, familia, peso, maxw, maxlin, ini, minimo):
    """Maior tamanho de fonte em que o texto cabe em maxlin linhas."""
    for tam in range(ini, minimo - 1, -2):
        f = fonte(familia, peso, tam)
        ls = quebra(d, txt, f, maxw)
        if len(ls) <= maxlin:
            return f, ls
    f = fonte(familia, peso, minimo)
    return f, quebra(d, txt, f, maxw)[:maxlin]


def gradiente(w, h, c1, c2, ang=0.0):
    """Gradiente diagonal suave (ang em fração 0..1 desloca o centro)."""
    import numpy as np
    y, x = np.mgrid[0:h, 0:w].astype("float32")
    t = (x / w * 0.55 + y / h * 0.45 + ang) % 2.0
    t = np.where(t > 1.0, 2.0 - t, t)[..., None]
    a = np.array(c1, dtype="float32")
    b = np.array(c2, dtype="float32")
    return Image.fromarray((a * (1 - t) + b * t).astype("uint8"), "RGB")


_LOGOS = {}


def logo(nome, altura):
    k = (nome, altura)
    if k not in _LOGOS:
        im = Image.open(f"{ASSETS}/{nome}.png").convert("RGBA")
        w = round(im.width * altura / im.height)
        _LOGOS[k] = im.resize((w, altura), Image.LANCZOS)
    return _LOGOS[k]


def arcos(d, cx, cy, escala, cores, larg, giro=0.0):
    """Os 3 Cs do símbolo, desenhados com ponta redonda."""
    for (ox, r, abre), cor in zip(((0.0, 16.5, 42), (1.8, 10.2, 50), (3.6, 4.2, 72)), cores):
        rr = r * escala
        x0 = cx + ox * escala
        a0, a1 = abre + giro, 360 - abre + giro
        # o PIL desenha a espessura para DENTRO da caixa: a caixa cresce meia espessura para o meio
        # do traço ficar no raio certo e as pontas redondas encaixarem (sem "bolinha" sobrando)
        ro = rr + larg / 2
        d.arc([x0 - ro, cy - ro, x0 + ro, cy + ro], a0, a1, fill=cor, width=larg)
        for a in (a0, a1):
            px, py = x0 + rr * math.cos(math.radians(a)), cy + rr * math.sin(math.radians(a))
            q = larg / 2 - 0.5
            d.ellipse([px - q, py - q, px + q, py + q], fill=cor)


def pontos(d, w, y, pag, total, ativo, inativo):
    tam, gap = 14, 12
    larg = total * tam + (total - 1) * gap + 18
    x = (w - larg) // 2
    for i in range(total):
        if i == pag:
            d.rounded_rectangle([x, y, x + tam + 18, y + tam], radius=tam // 2, fill=ativo)
            x += tam + 18 + gap
        else:
            d.ellipse([x, y, x + tam, y + tam], fill=inativo)
            x += tam + gap


# ---------------------------------------------------------------- carrossel
W, H = 1080, 1350


def lamina_capa(l, estilo, total):
    c1, c2 = GRADIENTES[estilo % len(GRADIENTES)]
    im = gradiente(W, H, c1, c2).convert("RGBA")
    d = ImageDraw.Draw(im)
    # símbolo grande vazado de fundo
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arcos(ImageDraw.Draw(camada), W - 120, H - 260, 26, [(255, 255, 255, 38)] * 3, 70)
    im.alpha_composite(camada)
    lg = logo("logo_branco", 74)
    im.alpha_composite(lg, (84, 84))
    d.rounded_rectangle([84, 230, 84 + 16, 230 + 120], radius=8, fill=LARANJA if c2 != LARANJA else BRANCO)
    f, ls = cabe(d, l["titulo"].upper(), "Unbounded", 900, W - 190, 6, 112, 62)
    y = 230
    lh = int(f.size * 1.08)
    for ln in ls:
        d.text((126, y), ln, font=f, fill=BRANCO)
        y += lh
    y += 40
    ft, lt = cabe(d, l["texto"], "Onest", 500, W - 220, 4, 46, 34)
    for ln in lt:
        d.text((126, y), ln, font=ft, fill=(255, 255, 255, 235))
        y += int(ft.size * 1.32)
    # chamada para arrastar
    fa = texto_f(34, 700)
    tx = "arraste"
    tw = d.textlength(tx, font=fa)
    x1, y1 = W - 84, H - 84
    d.rounded_rectangle([x1 - tw - 120, y1 - 74, x1, y1], radius=37, fill=BRANCO)
    d.text((x1 - tw - 82, y1 - 57), tx, font=fa, fill=c1)
    ax = x1 - 52
    d.line([ax - 22, y1 - 37, ax + 6, y1 - 37], fill=c1, width=6)
    d.polygon([(ax + 14, y1 - 37), (ax - 2, y1 - 50), (ax - 2, y1 - 24)], fill=c1)
    pontos(d, W, H - 66, 0, total, BRANCO, (255, 255, 255, 110))
    return im.convert("RGB")


def lamina_meio(l, pag, total, estilo):
    c1, c2 = GRADIENTES[estilo % len(GRADIENTES)]
    acento = [VIOLETA, ROSA, LARANJA][pag % 3]
    im = Image.new("RGB", (W, H), CLARO)
    d = ImageDraw.Draw(im)
    # faixa de cor da marca no topo
    im.paste(gradiente(W, 18, c1, c2), (0, 0))
    # bloco de texto centralizado na altura útil
    fn = titulo_f(150, 900)
    f, ls = cabe(d, l["titulo"], "Unbounded", 800, W - 168, 4, 84, 52)
    ft, lt = cabe(d, l["texto"], "Onest", 500, W - 168, 8, 56, 38)
    lh_t, lh_x = int(f.size * 1.14), int(ft.size * 1.42)
    altura = 170 + len(ls) * lh_t + 26 + 10 + 50 + len(lt) * lh_x
    y = max(110, (H - 140 - altura) // 2 + 20)
    d.text((84, y - 20), f"{pag:02d}", font=fn, fill=acento)
    y += 170
    for ln in ls:
        d.text((84, y), ln, font=f, fill=ESCURO)
        y += lh_t
    y += 26
    d.rounded_rectangle([84, y, 84 + 110, y + 10], radius=5, fill=acento)
    y += 50
    for ln in lt:
        d.text((84, y), ln, font=ft, fill=CINZA)
        y += lh_x
    im = im.convert("RGBA")
    im.alpha_composite(logo("logo_cor", 46), (84, H - 112))
    d = ImageDraw.Draw(im)
    fp = texto_f(30, 700)
    t = f"{pag + 1}/{total}"
    d.text((W - 84 - d.textlength(t, font=fp), H - 104), t, font=fp, fill=CINZA)
    return im.convert("RGB")


def lamina_fim(l, total, estilo):
    im = gradiente(W, H, ESCURO, VIOLETA).convert("RGBA")
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arcos(ImageDraw.Draw(camada), W // 2 - 40, 330, 9.5, [VIOLETA + (255,), ROSA + (255,), LARANJA + (255,)], 34)
    im.alpha_composite(camada)
    d = ImageDraw.Draw(im)
    y = 560
    f, ls = cabe(d, l["titulo"], "Unbounded", 800, W - 200, 3, 84, 52)
    for ln in ls:
        d.text(((W - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=BRANCO)
        y += int(f.size * 1.14)
    y += 30
    ft, lt = cabe(d, l["texto"], "Onest", 500, W - 220, 4, 44, 32)
    for ln in lt:
        d.text(((W - d.textlength(ln, font=ft)) / 2, y), ln, font=ft, fill=(236, 230, 255))
        y += int(ft.size * 1.38)
    # botão do site
    fb = titulo_f(48, 800)
    tx = "clilin.com"
    tw = d.textlength(tx, font=fb)
    bx, by = (W - tw) / 2 - 56, H - 330
    botao = gradiente(int(tw + 112), 110, ROSA, LARANJA).convert("RGBA")
    m = Image.new("L", botao.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, botao.width - 1, botao.height - 1], radius=55, fill=255)
    im.paste(botao, (int(bx), by), m)
    d.text((bx + 56, by + 26), tx, font=fb, fill=BRANCO)
    im.alpha_composite(logo("logo_branco", 58), ((W - logo("logo_branco", 58).width) // 2, H - 150))
    return im.convert("RGB")


def render_carrossel(item_id):
    c = ler(item_id)
    ls = c["laminas"]
    total = len(ls)
    pasta = f"{ITENS}/{item_id}"
    for f in os.listdir(pasta):
        if re.fullmatch(r"l\d+\.jpg", f):
            os.remove(f"{pasta}/{f}")
    for i, l in enumerate(ls):
        if i == 0:
            im = lamina_capa(l, c.get("estilo", 0), total)
        elif i == total - 1:
            im = lamina_fim(l, total, c.get("estilo", 0))
        else:
            im = lamina_meio(l, i, total, c.get("estilo", 0))
        im.save(f"{pasta}/l{i + 1:02d}.jpg", quality=92)
    marca(item_id, estado="pronto")
    log("carrossel desenhado", item_id, total, "lâminas")


# ---------------------------------------------------------------- reels (motion em HTML: motion/reel.html)
sys.path.insert(0, f"{AQUI}/motion")
import render as motion  # noqa: E402


def tts_ts(e, texto, pasta):
    """Narração inteira numa chamada só, com o tempo de cada letra (para animar no ritmo da fala)."""
    voz = e.get("CLILIN_VOZ") or e.get("TTS_VOZ") or "YMsc4g1hLpt43RnYIKOh"
    modelo = e.get("CLILIN_TTS_MODEL") or e.get("TTS_MODEL") or "eleven_v4"
    mp3, js = f"{pasta}/narracao.mp3", f"{pasta}/narracao.json"
    if os.path.exists(mp3) and os.path.exists(js):
        d = json.load(open(js))
        if d.get("voz") == voz and d.get("texto") == texto:
            return mp3, d["alinhamento"]
    key = e.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ERRO: falta ELEVENLABS_API_KEY")
    body = json.dumps({"text": texto, "model_id": modelo, "language_code": "pt"}).encode()
    for tent in range(3):
        try:
            rq = urllib.request.Request(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128",
                data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
            r = json.loads(urllib.request.urlopen(rq, timeout=180).read())
            break
        except urllib.error.HTTPError as x:
            log("erro TTS", x.code, limpa(x.read()[:200].decode("utf-8", "replace")))
            if x.code in (400, 401, 403, 422):
                sys.exit(2)
            time.sleep(5)
    else:
        sys.exit("ERRO: TTS falhou")
    import base64
    open(mp3, "wb").write(base64.b64decode(r["audio_base64"]))
    al = r.get("alignment") or r.get("normalized_alignment")
    json.dump({"voz": voz, "texto": texto, "alinhamento": al}, open(js, "w"), ensure_ascii=False)
    return mp3, al


def render_reel(item_id, e=None):
    e = e or env()
    c = ler(item_id)
    pasta = f"{ITENS}/{item_id}"
    cenas = [dict(s) for s in c["cenas"]]
    texto = " ".join(s["fala"].strip() for s in cenas)
    mp3, al = tts_ts(e, texto, pasta)
    dur = motion.alinha(cenas, al)
    dados = {"cenas": cenas, "dur": dur, "oferta": c.get("oferta")}
    mudo = f"{pasta}/mudo.mp4"
    log("montando motion", item_id, f"{dur:.1f}s")
    sons = motion.quadros(dados, mudo, log=log)
    trilhas = sorted(f for f in os.listdir(TRILHAS) if f.endswith(".mp3")) if os.path.isdir(TRILHAS) else []
    trilha = f"{TRILHAS}/{trilhas[int(item_id[:8]) % len(trilhas)]}" if trilhas else None
    final = f"{pasta}/reel.mp4"
    motion.mistura(mudo, mp3, sons, trilha, dur, final, vol_trilha=float(e.get("CLILIN_VOL_TRILHA") or 0.30))
    # capa: primeira tela de celular com a ação acontecendo, ou o gancho
    cel = next((s for s in cenas if s["tipo"] == "celular"), None)
    t_capa = min(cel["ini"] + 1.6, cel["fim"] - 0.2) if cel else 1.2
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t_capa:.2f}", "-i", final, "-frames:v", "1", "-q:v", "3",
                    f"{pasta}/capa.jpg"], check=True)
    os.remove(mudo)
    marca(item_id, estado="pronto", duracao=round(dur, 1), trilha=os.path.basename(trilha or ""))
    log("reels montado", item_id, f"{dur:.1f}s")


def render(item_id):
    tipo = ler(item_id)["tipo"]
    (render_carrossel if tipo == "carrossel" else render_reel)(item_id)


# ---------------------------------------------------------------- publicação
def legenda(c):
    tags = " ".join("#" + re.sub(r"[^\w]", "", h.lstrip("#")) for h in (c.get("hashtags") or [])[:5] if h.strip("# "))
    return (c["legenda"].strip() + ("\n\n" + tags if tags else "")).strip()


def meta(e):
    tok = e.get("CLILIN_IG_TOKEN") or e.get("IG_TOKEN")
    ig = e.get("CLILIN_IG_USER_ID") or "17841471261197278"

    def req(method, path, data=None, token=None):
        data = dict(data or {})
        data["access_token"] = token or tok
        u = f"{G}/{path}"
        if method == "GET":
            r = urllib.request.Request(u + "?" + urllib.parse.urlencode(data))
        else:
            r = urllib.request.Request(u, data=urllib.parse.urlencode(data).encode(), method=method)
        try:
            return json.loads(urllib.request.urlopen(r, timeout=120).read() or b"{}")
        except urllib.error.HTTPError as x:
            raise RuntimeError("ERRO " + limpa(x.read().decode("utf-8", "replace"))[:400])

    return req, ig


def pagina_fb(e, req):
    nome = (e.get("CLILIN_FB_PAGE") or "Clilin").lower()
    for p in req("GET", "me/accounts", {"fields": "id,name,access_token,instagram_business_account", "limit": 100}).get("data", []):
        iga = (p.get("instagram_business_account") or {}).get("id")
        if p.get("name", "").lower() == nome or iga == (e.get("CLILIN_IG_USER_ID") or "17841471261197278"):
            return p["id"], p["access_token"]
    return None, None


def publica_arquivos(item_id, nomes):
    """Copia para a pasta pública (clilin.com/media/conteudo) com nome único."""
    dst = f"{MEDIA}/{item_id}"
    os.makedirs(dst, exist_ok=True)
    st = str(int(time.time()))
    urls = []
    for n in nomes:
        base, ext = os.path.splitext(n)
        alvo = f"{base}_{st}{ext}"
        shutil.copy(f"{ITENS}/{item_id}/{n}", f"{dst}/{alvo}")
        urls.append(f"{URL}/{item_id}/{alvo}")
    return urls


def espera_container(req, cid, limite=600):
    t = time.time()
    falhas = 0
    time.sleep(3)
    while time.time() - t < limite:
        try:
            st = req("GET", cid, {"fields": "status_code"}).get("status_code")
        except RuntimeError as x:
            # logo depois de criado, o container às vezes ainda não responde (subcode 33)
            falhas += 1
            if falhas > 8 or "Unsupported get" not in str(x):
                raise
            time.sleep(8)
            continue
        if st == "FINISHED":
            return
        if st in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"container {st}")
        time.sleep(8)
    raise RuntimeError("container demorou demais")


def carrossel_ig(req, ig, urls, cap, rodadas=1):
    """Cria o container do carrossel no Instagram. A Meta às vezes devolve id "0" ou status ERROR
    (código 2207032) logo depois de subir as lâminas: espera e refaz do zero.
    Enquanto o @clilin.oficial não estiver ligado à página do Facebook, a Meta recusa carrossel COM
    legenda (sem legenda passa). Nesse caso a última rodada sai sem legenda e a legenda vira o
    primeiro comentário. Devolve (container, legenda_no_comentario)."""
    for rodada in range(rodadas + 1):
        sem_legenda = rodada == rodadas
        if sem_legenda:
            log("carrossel sem legenda (a legenda vai no primeiro comentário)")
        filhos = [req("POST", f"{ig}/media", {"image_url": u, "is_carousel_item": "true"})["id"] for u in urls]
        for f in filhos:
            espera_container(req, f, 120)
        cid = "0"
        for tent in range(3):
            time.sleep(10 + tent * 10)
            dados = {"media_type": "CAROUSEL", "children": ",".join(filhos)}
            if not sem_legenda:
                dados["caption"] = cap
            cid = str(req("POST", f"{ig}/media", dados).get("id") or "0")
            if cid != "0":
                break
        if cid != "0":
            try:
                espera_container(req, cid, 180)
                return cid, sem_legenda
            except RuntimeError as x:
                log("carrossel recusado pela Meta:", limpa(x)[:120])
        if rodada < rodadas:
            time.sleep(30)
    raise RuntimeError("Meta não aceitou o carrossel depois de várias tentativas")


def postar_item(item_id):
    e = env()
    c = ler(item_id)
    req, ig = meta(e)
    cap = legenda(c)
    est = estado(item_id)
    pasta = f"{ITENS}/{item_id}"
    if c["tipo"] == "carrossel":
        imgs = sorted(f for f in os.listdir(pasta) if re.fullmatch(r"l\d+\.jpg", f))
        urls = publica_arquivos(item_id, imgs)
        if not est.get("instagram"):
            cid, comentario = carrossel_ig(req, ig, urls, cap)
            mid = req("POST", f"{ig}/media_publish", {"creation_id": cid})["id"]
            if comentario:
                try:
                    req("POST", f"{mid}/comments", {"message": cap})
                except RuntimeError as x:
                    log("não deu para comentar a legenda:", limpa(x)[:120])
            link = req("GET", mid, {"fields": "permalink"}).get("permalink")
            est = marca(item_id, instagram=link or mid)
            log("INSTAGRAM OK", link)
        pid, ptok = pagina_fb(e, req)
        if pid and not est.get("facebook"):
            fotos = [req("POST", f"{pid}/photos", {"url": u, "published": "false"}, token=ptok)["id"] for u in urls]
            dados = {"message": cap}
            for k, f in enumerate(fotos):
                dados[f"attached_media[{k}]"] = json.dumps({"media_fbid": f})
            post = req("POST", f"{pid}/feed", dados, token=ptok)["id"]
            est = marca(item_id, facebook=req("GET", post, {"fields": "permalink_url"}, token=ptok).get("permalink_url") or post)
            log("FACEBOOK OK", est["facebook"])
        elif not pid:
            log("página do Facebook do Clilin ainda não ligada: só Instagram")
    else:
        (vurl,) = publica_arquivos(item_id, ["reel.mp4"])
        if not est.get("instagram"):
            cid = req("POST", f"{ig}/media", {"media_type": "REELS", "video_url": vurl, "caption": cap,
                                               "share_to_feed": "true", "thumb_offset": "900"})["id"]
            espera_container(req, cid, 900)
            mid = req("POST", f"{ig}/media_publish", {"creation_id": cid})["id"]
            link = req("GET", mid, {"fields": "permalink"}).get("permalink")
            est = marca(item_id, instagram=link or mid)
            log("INSTAGRAM OK", link)
        pid, ptok = pagina_fb(e, req)
        if pid and not est.get("facebook"):
            v = req("POST", f"{pid}/videos", {"file_url": vurl, "description": cap}, token=ptok)
            est = marca(item_id, facebook=f"https://www.facebook.com/{v.get('id')}")
            log("FACEBOOK OK", est["facebook"])
        elif not pid:
            log("página do Facebook do Clilin ainda não ligada: só Instagram")
    marca(item_id, estado="postado", postado=agora().isoformat(timespec="seconds"))


def postar(tipo):
    prontos = [i for i in itens(tipo) if estado(i).get("estado") in ("pronto", "erro_post")]
    if not prontos:
        log("nada pronto para postar:", tipo)
        return
    item_id = prontos[0]
    try:
        postar_item(item_id)
    except Exception as x:  # noqa: BLE001
        e = estado(item_id)
        tent = e.get("tentativas", 0) + 1
        marca(item_id, estado="erro_post" if tent < 3 else "falhou", tentativas=tent, erro=limpa(x)[:400])
        log("ERRO ao postar", item_id, limpa(x)[:300])
        raise SystemExit(1)


def rodar():
    for tipo in ("carrossel", "reel"):
        ja = [i for i in itens(tipo) if estado(i).get("estado") == "pronto"]
        if ja:
            log(tipo, "já tem pronto na fila:", ja[0])
            continue
        item_id = escrever(tipo)
        render(item_id)


SOBRE = ("Ofertas da sua cidade com cupom grátis no WhatsApp. Pegue o cupom no clilin.com e use na loja. "
         "Um produto do Grupo MAXIMO.")


def pagina():
    """Arruma a página do Facebook: foto de perfil, capa, sobre e site."""
    e = env()
    req, _ = meta(e)
    pid, ptok = pagina_fb(e, req)
    if not pid:
        log("página do Facebook não encontrada no token (falta atribuir ao usuário do sistema)")
        raise SystemExit(1)
    dst = f"{MEDIA}/pagina"
    os.makedirs(dst, exist_ok=True)
    st = str(int(time.time()))
    u = {}
    for n in ("perfil", "capa"):
        shutil.copy(f"{ASSETS}/redes/{n}.png", f"{dst}/{n}_{st}.png")
        u[n] = f"{URL}/pagina/{n}_{st}.png"
    passos = [
        ("foto de perfil", lambda: req("POST", f"{pid}/picture", {"picture": u["perfil"]}, token=ptok)),
        ("capa", lambda: req("POST", pid, {"cover": req("POST", f"{pid}/photos", {"url": u["capa"], "published": "false"},
                                                         token=ptok)["id"]}, token=ptok)),
        ("sobre e site", lambda: req("POST", pid, {"about": SOBRE, "website": "https://clilin.com"}, token=ptok)),
    ]
    for nome, f in passos:
        try:
            log(nome, "OK", json.dumps(f())[:120])
        except Exception as x:  # noqa: BLE001
            log(nome, "FALHOU", limpa(x)[:300])
    info = req("GET", pid, {"fields": "name,link,about,website,instagram_business_account"}, token=ptok)
    print(json.dumps(info, ensure_ascii=False))


def status():
    for i in itens():
        e = estado(i)
        c = ler(i)
        print(i, c.get("tipo"), c.get("pauta"), "|", e.get("estado"), "|", c.get("titulo_interno"),
              "|", e.get("instagram") or "", e.get("erro") or "")


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return
    cmd = a[0]
    if cmd == "status":
        return status()
    lk = trava(cmd)  # noqa: F841
    if cmd == "rodar":
        rodar()
    elif cmd == "escrever":
        escrever(a[1])
    elif cmd == "render":
        render(a[1])
    elif cmd == "postar":
        postar(a[1])
    elif cmd == "pagina":
        pagina()
    elif cmd == "agora":
        for tipo in (a[1:] or ["carrossel", "reel"]):
            item_id = escrever(tipo)
            render(item_id)
            postar_item(item_id)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
