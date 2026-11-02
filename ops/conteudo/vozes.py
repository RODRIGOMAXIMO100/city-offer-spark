#!/usr/bin/env python3
"""Escolha de voz para os reels do Clilin.

  vozes.py buscar [male|female]        lista vozes brasileiras da biblioteca do ElevenLabs
  vozes.py amostras ID[:nome] ID ...   gera a mesma frase em cada voz e monta uma página
                                       em https://clilin.com/media/conteudo/vozes/
"""
import html
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from clilin_conteudo import MEDIA, URL, env  # noqa: E402

API = "https://api.elevenlabs.io/v1"
FRASE = ("Sua loja só paga quando o cliente aparece. Você publica a oferta no Clilin, "
         "o cliente pega o cupom grátis no WhatsApp e mostra no balcão. Simples assim.")


def chama(key, path, dados=None, metodo=None, accept="application/json"):
    rq = urllib.request.Request(f"{API}/{path}", data=json.dumps(dados).encode() if dados is not None else None,
                                headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": accept},
                                method=metodo or ("POST" if dados is not None else "GET"))
    try:
        r = urllib.request.urlopen(rq, timeout=120).read()
    except urllib.error.HTTPError as x:
        raise RuntimeError(f"{x.code} {x.read().decode('utf-8', 'replace')[:300]}")
    return r if accept != "application/json" else json.loads(r or b"{}")


def buscar(key, genero=None):
    q = {"page_size": 40, "language": "pt", "accent": "brazilian", "sort": "cloned_by_count"}
    if genero:
        q["gender"] = genero
    for v in chama(key, "shared-voices?" + urllib.parse.urlencode(q)).get("voices", []):
        print(v["voice_id"], v.get("public_owner_id"), "|", v.get("name"), "|", v.get("gender"), v.get("age"),
              "|", v.get("use_case"), "|", v.get("descriptive"), "| usos", v.get("cloned_by_count"))


def tts(key, voz, modelo):
    return chama(key, f"text-to-speech/{voz}?output_format=mp3_44100_128",
                 {"text": FRASE, "model_id": modelo, "language_code": "pt"}, accept="audio/mpeg")


def amostras(key, e, ids):
    modelo = e.get("TTS_MODEL") or "eleven_v4"
    dst = f"{MEDIA}/vozes"
    os.makedirs(dst, exist_ok=True)
    feitos = []
    for n, item in enumerate(ids, 1):
        voz, _, nome = item.partition(":")
        try:
            audio = tts(key, voz, modelo)
        except RuntimeError as x:
            print("falhou", voz, x)
            continue
        arq = f"voz{n}.mp3"
        open(f"{dst}/{arq}", "wb").write(audio)
        feitos.append((n, nome or voz, arq, voz))
        print("ok", n, nome, voz)
    linhas = "".join(
        f'<div class="v"><b>Voz {n}</b><span>{html.escape(nome)}</span><audio controls preload="none" src="{arq}"></audio></div>'
        for n, nome, arq, _ in feitos)
    pagina = f"""<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Vozes do Clilin</title>
<style>body{{font-family:system-ui,sans-serif;background:#FBF8FF;color:#170A2E;margin:0;padding:24px 16px;max-width:560px;margin:auto}}
h1{{font-size:22px}}p{{color:#5b4f73}}.v{{background:#fff;border:1px solid #e6dcf7;border-radius:16px;padding:14px;margin:12px 0}}
.v b{{display:block;font-size:18px}}.v span{{color:#7a6e92;font-size:13px}}audio{{width:100%;margin-top:8px}}</style>
<h1>Escolha a voz dos reels</h1><p>Mesma frase em cada voz:<br><i>{html.escape(FRASE)}</i></p>{linhas}</html>"""
    open(f"{dst}/index.html", "w").write(pagina)
    json.dump([{"n": n, "nome": nome, "voz": voz} for n, nome, _, voz in feitos], open(f"{dst}/vozes.json", "w"), ensure_ascii=False)
    print("PAGINA", f"{URL}/vozes/")


def main():
    e = env()
    key = e.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("falta ELEVENLABS_API_KEY")
    a = sys.argv[1:]
    if not a:
        print(__doc__)
    elif a[0] == "buscar":
        buscar(key, a[1] if len(a) > 1 else None)
    elif a[0] == "amostras":
        amostras(key, e, a[1:])


if __name__ == "__main__":
    main()
