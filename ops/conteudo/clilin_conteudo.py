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
- O cliente mostra o código na loja ou manda no WhatsApp da loja. O empresário confere o código no painel do Clilin. Cada cupom vale uma vez.
- A loja só paga pelo cupom usado: 15% do preço da oferta, mínimo de R$ 3. Sem mensalidade. Visita e cupom não usado não custam nada. Com saldo pré-pago, 10% de desconto.
- Divulgador: indica as ofertas da cidade pelo próprio link e ganha metade da taxa de cada cupom usado por quem veio do link dele, chegando a 70% conforme o nível. Saque por Pix a partir de R$ 100. Cadastro grátis, não precisa ter muitos seguidores.
- Cliente: grátis, sem app e sem cadastro.
- Ofertas separadas por cidade. Site: clilin.com (ofertas em clilin.com/ofertas). O Clilin é um produto do Grupo MAXIMO.

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
    "reel": """Escreva UM reels de 35 a 45 segundos, narrado por uma voz só. JSON:
{"titulo_interno": "resumo de 5 a 8 palavras",
 "legenda": "legenda do post, 2 a 4 frases curtas, termina com chamada para clilin.com ou link da bio",
 "hashtags": ["até 5 hashtags sem espaço, começando com #"],
 "cenas": [{"fala": "o que a voz fala", "tela": "texto grande na tela", "apoio": "linha pequena opcional ou vazio"}]}
Regras: 6 a 8 cenas. A 1ª é o gancho (prende nos 2 primeiros segundos). A última é a chamada para clilin.com.
"fala": 1 ou 2 frases naturais de falar em voz alta, somando 90 a 115 palavras no vídeo todo. Escreva valores por extenso do jeito que se fala ("quinze por cento", "três reais").
"tela": até 6 palavras, o recado principal da cena. "apoio": até 10 palavras ou "".""",
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
        if not 5 <= len(cs) <= 9:
            return f"{len(cs)} cenas"
        if any(not (s.get("fala") and s.get("tela")) for s in cs):
            return "cena sem fala ou tela"
        n = sum(len(s["fala"].split()) for s in cs)
        if not 70 <= n <= 140:
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
        d.arc([x0 - rr, cy - rr, x0 + rr, cy + rr], a0, a1, fill=cor, width=larg)
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


# ---------------------------------------------------------------- reels
VW, VH, FPS = 1080, 1920, 30
FUNDOS = [(VIOLETA, ROSA), (ROSA, LARANJA), (ESCURO, VIOLETA), (VIOLETA, LARANJA), (ESCURO, ROSA)]


def ffprobe_dur(arq):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                       capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def tts(e, texto, destino):
    voz = e.get("TTS_VOZ") or "YMsc4g1hLpt43RnYIKOh"
    modelo = e.get("TTS_MODEL") or "eleven_v4"
    key = e.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ERRO: falta ELEVENLABS_API_KEY")
    body = json.dumps({"text": texto, "model_id": modelo, "language_code": "pt"}).encode()
    for tent in range(3):
        try:
            rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128",
                                        data=body, headers={"xi-api-key": key, "Content-Type": "application/json",
                                                            "Accept": "audio/mpeg"})
            open(destino, "wb").write(urllib.request.urlopen(rq, timeout=120).read())
            return
        except urllib.error.HTTPError as x:
            msg = limpa(x.read()[:200].decode("utf-8", "replace"))
            log("erro TTS", x.code, msg)
            if x.code in (400, 401, 403, 422):
                sys.exit(2)
            time.sleep(5)
    sys.exit("ERRO: TTS falhou")


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


class Cena:
    """Desenha os quadros de uma cena do reels."""

    def __init__(self, s, i, total, dur, t0, tt):
        self.s, self.i, self.total, self.dur, self.t0, self.tt = s, i, total, dur, t0, tt
        c1, c2 = FUNDOS[i % len(FUNDOS)]
        self.fundo = gradiente(VW, VH, c1, c2).convert("RGBA")
        self.acento = LARANJA if c2 != LARANJA else BRANCO
        d = ImageDraw.Draw(self.fundo)
        self.f_tela, self.l_tela = cabe(d, (s["tela"] or "").upper(), "Unbounded", 900, VW - 170, 5, 118, 64)
        self.f_apoio, self.l_apoio = cabe(d, s.get("apoio") or "", "Onest", 600, VW - 200, 2, 50, 36)
        self.f_leg, self.l_leg = cabe(d, s["fala"], "Onest", 600, VW - 200, 4, 44, 32)
        self.ultima = i == total - 1

    def quadro(self, t):
        im = self.fundo.copy()
        camada = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
        dc = ImageDraw.Draw(camada)
        giro = (self.t0 + t) * 12
        arcos(dc, VW - 150, 520, 30, [(255, 255, 255, 34)] * 3, 64, giro)
        im.alpha_composite(camada)
        d = ImageDraw.Draw(im)
        # barra de progresso do vídeo
        p = (self.t0 + t) / self.tt
        d.rounded_rectangle([60, 70, VW - 60, 80], radius=5, fill=(255, 255, 255, 70))
        d.rounded_rectangle([60, 70, 60 + (VW - 120) * p, 80], radius=5, fill=BRANCO)
        if not self.ultima:
            lg = logo("logo_branco", 58)
            im.alpha_composite(lg, (90, 130))
        if self.ultima:
            self._fim(im, d, t)
        else:
            self._texto(im, d, t)
        return im.convert("RGB")

    def _texto(self, im, d, t):
        lh = int(self.f_tela.size * 1.1)
        bloco = lh * len(self.l_tela)
        y0 = 600 - bloco // 2
        for k, ln in enumerate(self.l_tela):
            a = ease((t - 0.08 * k) / 0.45)
            off = int((1 - a) * 90)
            camada = Image.new("RGBA", (VW, lh + 20), (0, 0, 0, 0))
            ImageDraw.Draw(camada).text((90, 0), ln, font=self.f_tela, fill=BRANCO + (int(255 * a),))
            im.alpha_composite(camada, (0, y0 + k * lh + off))
        # traço de acento
        a = ease((t - 0.3) / 0.4)
        y = y0 + bloco + 30
        d.rounded_rectangle([90, y, 90 + int(150 * a), y + 14], radius=7, fill=self.acento)
        if self.l_apoio and self.l_apoio[0]:
            a2 = ease((t - 0.45) / 0.4)
            yy = y + 54
            for ln in self.l_apoio:
                d.text((90, yy), ln, font=self.f_apoio, fill=(255, 255, 255, int(235 * a2)))
                yy += int(self.f_apoio.size * 1.3)
        self._legenda(im, t)

    def _legenda(self, im, t, y=None):
        # legenda da fala (muita gente assiste sem som), acima da área que o Instagram cobre
        lh = int(self.f_leg.size * 1.34)
        h = lh * len(self.l_leg) + 56
        y = VH - 470 - h if y is None else y
        a = ease(t / 0.3)
        caixa = Image.new("RGBA", (VW - 120, h), (0, 0, 0, 0))
        dc = ImageDraw.Draw(caixa)
        dc.rounded_rectangle([0, 0, VW - 121, h - 1], radius=34, fill=(255, 255, 255, int(240 * a)))
        yy = 28
        for ln in self.l_leg:
            dc.text(((VW - 120 - dc.textlength(ln, font=self.f_leg)) / 2, yy), ln, font=self.f_leg,
                    fill=ESCURO + (int(255 * a),))
            yy += lh
        im.alpha_composite(caixa, (60, y))

    def _fim(self, im, d, t):
        a = ease(t / 0.5)
        lg = logo("logo_branco", 150)
        im.alpha_composite(lg, ((VW - lg.width) // 2, 330 - int((1 - a) * 60)))
        lh = int(self.f_tela.size * 1.1)
        y = 620
        for ln in self.l_tela:
            d.text(((VW - d.textlength(ln, font=self.f_tela)) / 2, y), ln, font=self.f_tela, fill=BRANCO + (int(255 * a),))
            y += lh
        fb = titulo_f(56, 800)
        tx = "clilin.com"
        tw = d.textlength(tx, font=fb)
        a2 = ease((t - 0.35) / 0.45)
        bw, bh = int(tw + 130), 124
        botao = gradiente(bw, bh, ROSA, LARANJA).convert("RGBA")
        m = Image.new("L", botao.size, 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, bw - 1, bh - 1], radius=62, fill=int(255 * a2))
        by = y + 70
        im.paste(botao, ((VW - bw) // 2, by), m)
        d.text(((VW - tw) / 2, by + 30), tx, font=fb, fill=BRANCO + (int(255 * a2),))
        self._legenda(im, t, by + bh + 60)


def render_reel(item_id, e=None, tts_fn=None):
    e = e or env()
    c = ler(item_id)
    pasta = f"{ITENS}/{item_id}"
    cenas = c["cenas"]
    pad = 0.35
    durs, audios = [], []
    for i, s in enumerate(cenas):
        a = f"{pasta}/fala{i + 1:02d}.mp3"
        if not os.path.exists(a) or os.path.getsize(a) == 0:
            (tts_fn or tts)(e, s["fala"], a)
        audios.append(a)
        durs.append(ffprobe_dur(a) + pad)
    durs[-1] += 1.2  # respiro no fim
    total = sum(durs)
    # narração com os respiros entre as cenas
    lista = f"{pasta}/narracao.txt"
    with open(lista, "w") as fl:
        for a, dd in zip(audios, durs):
            fl.write(f"file '{os.path.basename(a)}'\nduration {dd:.3f}\n")
    narr = f"{pasta}/narracao.wav"
    filtros = []
    entradas = []
    for k, (a, dd) in enumerate(zip(audios, durs)):
        entradas += ["-i", a]
        filtros.append(f"[{k}:a]aresample=44100,apad,atrim=0:{dd:.3f}[a{k}]")
    filtros.append("".join(f"[a{k}]" for k in range(len(audios))) + f"concat=n={len(audios)}:v=0:a=1[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros), "-map", "[out]", narr],
                   check=True)
    # vídeo: quadros direto para o ffmpeg
    mudo = f"{pasta}/mudo.mp4"
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{VW}x{VH}",
                             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                             "-pix_fmt", "yuv420p", mudo], stdin=subprocess.PIPE)
    t0 = 0.0
    for i, (s, dd) in enumerate(zip(cenas, durs)):
        cena = Cena(s, i, len(cenas), dd, t0, total)
        for q in range(int(round(dd * FPS))):
            proc.stdin.write(cena.quadro(q / FPS).tobytes())
        t0 += dd
    proc.stdin.close()
    if proc.wait() != 0:
        sys.exit("ERRO: ffmpeg do vídeo")
    # trilha por baixo da voz
    trilhas = sorted(f for f in os.listdir(TRILHAS) if f.endswith(".mp3")) if os.path.isdir(TRILHAS) else []
    final = f"{pasta}/reel.mp4"
    if trilhas:
        tr = f"{TRILHAS}/{trilhas[hash(item_id) % len(trilhas)]}"
        fc = (f"[2:a]volume=0.13,afade=t=in:d=0.5,afade=t=out:st={max(total - 2, 0):.2f}:d=2,atrim=0:{total:.3f}[m];"
              f"[1:a]volume=1.0[v];[v][m]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-14:TP=-1.5[a]")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", mudo, "-i", narr, "-stream_loop", "-1", "-i", tr,
               "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
               "-ar", "44100", "-shortest", "-movflags", "+faststart", final]
    else:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", mudo, "-i", narr, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
               "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", final]
    subprocess.run(cmd, check=True)
    # capa (primeira cena já com o texto)
    Cena(cenas[0], 0, len(cenas), durs[0], 0, total).quadro(0.9).save(f"{pasta}/capa.jpg", quality=90)
    for tmp in (mudo, narr, lista):
        if os.path.exists(tmp):
            os.remove(tmp)
    marca(item_id, estado="pronto", duracao=round(total, 1))
    log("reels montado", item_id, f"{total:.1f}s")


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
            filhos = [req("POST", f"{ig}/media", {"image_url": u, "is_carousel_item": "true"})["id"] for u in urls]
            for f in filhos:
                espera_container(req, f, 120)
            cid = req("POST", f"{ig}/media", {"media_type": "CAROUSEL", "children": ",".join(filhos), "caption": cap})["id"]
            espera_container(req, cid, 180)
            mid = req("POST", f"{ig}/media_publish", {"creation_id": cid})["id"]
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
