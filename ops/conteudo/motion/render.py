"""Motor de motion dos reels do Clilin.

A animação é uma página HTML (reel.html) que desenha qualquer instante t de forma determinística.
O Playwright tira um quadro por vez (30 fps) e manda para o ffmpeg. Depois mistura voz, trilha
(abaixando sozinha quando a voz fala) e os efeitos sonoros que a própria página lista.
"""
import json
import os
import random
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
FPS = 30
SFX_DIR = os.path.join(AQUI, ".sfx")

# efeitos sonoros gerados com o próprio ffmpeg (sem arquivo de terceiros)
SFX = {
    "batida": ("0.9*sin(2*PI*(55+140*exp(-22*t))*t)*exp(-8*t)+0.25*(random(0)*2-1)*exp(-60*t)", 0.4, 0.55),
    "toque": ("0.7*sin(2*PI*1700*t)*exp(-70*t)+0.3*sin(2*PI*900*t)*exp(-50*t)", 0.1, 0.5),
    "tecla": ("0.5*sin(2*PI*2600*t)*exp(-120*mod(t,0.1))", 0.8, 0.22),
    "sobe": ("sin(2*PI*(260+1100*t)*t)*sin(PI*t/0.32)*0.35+0.15*(random(0)*2-1)*sin(PI*t/0.32)", 0.32, 0.45),
    "ding": ("0.5*(sin(2*PI*1318.5*t)+0.55*sin(2*PI*1975.5*t)+0.25*sin(2*PI*2637*t))*exp(-4.5*t)", 1.1, 0.42),
    "mensagem": ("0.55*sin(2*PI*(988+330*gte(t,0.075))*t)*exp(-22*mod(t,0.075))", 0.17, 0.5),
    "pop": ("0.7*sin(2*PI*(720-420*t/0.12)*t)*exp(-26*t)", 0.13, 0.5),
    "passa": ("(random(0)*2-1)*pow(sin(PI*t/0.48),2)*0.6", 0.48, 0.5),
}


def _ff(args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def prepara_sfx():
    os.makedirs(SFX_DIR, exist_ok=True)
    for nome, (expr, dur, _) in SFX.items():
        arq = os.path.join(SFX_DIR, f"{nome}.wav")
        if os.path.exists(arq):
            continue
        filtro = "highpass=f=700,lowpass=f=5200" if nome == "passa" else "anull"
        _ff(["-f", "lavfi", "-i", f"aevalsrc='{expr}':s=44100:d={dur}", "-af", filtro, arq])


def alinha(cenas, alinhamento, cauda=2.6):
    """Distribui as palavras da narração (com tempo) pelas cenas e define início/fim de cada cena."""
    chars = alinhamento["characters"]
    ini = alinhamento["character_start_times_seconds"]
    fim = alinhamento["character_end_times_seconds"]
    palavras, cur, a, b = [], "", None, None
    for ch, s, e in zip(chars, ini, fim):
        if ch.isspace():
            if cur:
                palavras.append({"w": cur, "ini": a, "fim": b})
            cur, a = "", None
            continue
        if a is None:
            a = s
        cur += ch
        b = e
    if cur:
        palavras.append({"w": cur, "ini": a, "fim": b})
    contagem = [len(c["fala"].split()) for c in cenas]
    total = sum(contagem)
    if total != len(palavras):  # normalização mexeu no texto: reparte proporcionalmente
        contagem = [round(n * len(palavras) / total) for n in contagem]
        contagem[-1] = len(palavras) - sum(contagem[:-1])
    k = 0
    for c, n in zip(cenas, contagem):
        c["palavras"] = palavras[k:k + n]
        k += n
    for i, c in enumerate(cenas):
        c["ini"] = 0.0 if i == 0 else max(0.0, c["palavras"][0]["ini"] - 0.12) if c["palavras"] else cenas[i - 1]["ini"] + 1
    dur = (palavras[-1]["fim"] if palavras else 10) + cauda
    for i, c in enumerate(cenas):
        c["fim"] = cenas[i + 1]["ini"] if i + 1 < len(cenas) else dur
    # cena final precisa de tempo para a marca desenhar
    if cenas[-1]["fim"] - cenas[-1]["ini"] < 3.2:
        dur = cenas[-1]["ini"] + 3.2
        cenas[-1]["fim"] = dur
    return round(dur, 3)


def quadros(dados, saida, log=print):
    """Renderiza o vídeo mudo. Devolve a lista de efeitos sonoros [{t, s}]."""
    from playwright.sync_api import sync_playwright

    n = int(dados["dur"] * FPS)
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(FPS),
                           "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                           "-pix_fmt", "yuv420p", "-r", str(FPS), saida], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        nav = p.chromium.launch(args=["--allow-file-access-from-files", "--disable-web-security"])
        pg = nav.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        pg.goto("file://" + os.path.join(AQUI, "reel.html"))
        pg.evaluate("d => init(d)", dados)
        pg.wait_for_function("window.pronto === true", timeout=30000)
        sons = pg.evaluate("window.SONS")
        for f in range(n):
            pg.evaluate(f"render({f / FPS:.4f})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=93))
            if f and f % 300 == 0:
                log(f"  quadro {f}/{n}")
        nav.close()
    ff.stdin.close()
    if ff.wait():
        raise RuntimeError("ffmpeg falhou nos quadros")
    return sons


def mistura(mudo, voz, sons, trilha, dur, saida, vol_trilha=0.30):
    prepara_sfx()
    ent = ["-i", mudo, "-i", voz]
    if trilha:
        ent += ["-stream_loop", "-1", "-i", trilha]
    base = 3 if trilha else 2
    fil = ["[1:a]aresample=44100,asplit=2[voz][chave]"]
    mix = ["[voz]"]
    if trilha:
        fil.append(f"[2:a]aresample=44100,atrim=0:{dur:.2f},volume={vol_trilha},afade=t=in:d=0.4,"
                   f"afade=t=out:st={max(0, dur - 1.6):.2f}:d=1.6[mus]")
        fil.append("[mus][chave]sidechaincompress=threshold=0.035:ratio=5:attack=15:release=350[musd]")
        mix.append("[musd]")
    else:
        fil.append("[chave]anullsink")
    usados = [s for s in sons if s["s"] in SFX and s["t"] < dur]
    for k, s in enumerate(usados):
        ent += ["-i", os.path.join(SFX_DIR, f"{s['s']}.wav")]
        ms = int(s["t"] * 1000)
        fil.append(f"[{base + k}:a]aresample=44100,volume={SFX[s['s']][2]},adelay={ms}|{ms}[s{k}]")
        mix.append(f"[s{k}]")
    fil.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first,"
               f"apad,atrim=0:{dur:.2f},loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    _ff([*ent, "-filter_complex", ";".join(fil), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
         "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-shortest", saida])


def escolhe_trilha(pasta):
    if not pasta or not os.path.isdir(pasta):
        return None
    ts = [os.path.join(pasta, f) for f in os.listdir(pasta) if f.lower().endswith((".mp3", ".wav", ".m4a"))]
    return random.choice(ts) if ts else None


if __name__ == "__main__":
    # teste local sem voz: python3 render.py exemplo.json saida.mp4
    import sys
    d = json.load(open(sys.argv[1]))
    t = 0.4
    for c in d["cenas"]:
        ws = []
        for w in c["fala"].split():
            dd = 0.09 + 0.045 * len(w)
            ws.append({"w": w, "ini": round(t, 3), "fim": round(t + dd, 3)})
            t += dd + 0.05
        c["palavras"] = ws
        t += 0.25
    al = {"characters": [], "character_start_times_seconds": [], "character_end_times_seconds": []}
    for c in d["cenas"]:
        for w in c["palavras"]:
            for i, ch in enumerate(w["w"] + " "):
                al["characters"].append(ch)
                al["character_start_times_seconds"].append(w["ini"] + i * 0.01)
                al["character_end_times_seconds"].append(w["fim"])
    d["dur"] = alinha(d["cenas"], al)
    sons = quadros(d, sys.argv[2])
    json.dump(sons, open(sys.argv[2] + ".sons.json", "w"))
    print("ok", d["dur"], len(sons), "sons")
