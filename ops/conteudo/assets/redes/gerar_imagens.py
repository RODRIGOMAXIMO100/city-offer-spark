from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os
A=os.path.dirname(os.path.abspath(__file__))+'/../'
def hexc(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
V,P,O,D,L=map(hexc,['6B2CD8','F42578','FF9F1A','170A2E','FBF8FF'])
def grad(w,h):
    x=np.linspace(0,1,w)[None,:]; y=np.linspace(0,1,h)[:,None]
    t=np.clip(0.75*x+0.25*y,0,1)
    a=np.zeros((h,w,3))
    for i in range(3):
        a[...,i]=np.where(t<0.55, V[i]+(P[i]-V[i])*(t/0.55), P[i]+(O[i]-P[i])*((t-0.55)/0.45))
    return Image.fromarray(a.astype('uint8'))
def font(sz,w=700,f='Unbounded.ttf'):
    ft=ImageFont.truetype(A+f,sz)
    try: ft.set_variation_by_axes([w])
    except Exception: pass
    return ft
# perfil: fundo claro + simbolo colorido
S=1080
pf=Image.new('RGB',(S,S),L)
sym=Image.open(A+'simbolo_cor.png'); r=560/sym.height; sym=sym.resize((int(sym.width*r),560),Image.LANCZOS)
pf.paste(sym,((S-sym.width)//2,(S-sym.height)//2),sym); pf.save('perfil.png')
# perfil alternativo gradiente + simbolo branco
pg=grad(S,S); sw=Image.open(A+'simbolo_branco.png').resize(sym.size,Image.LANCZOS)
pg.paste(sw,((S-sw.width)//2,(S-sw.height)//2),sw); pg.save('perfil_grad.png')
# capa 1640x624 (area segura central ~1200 de largura)
W,H=1640,624
c=grad(W,H); d=ImageDraw.Draw(c)
lg=Image.open(A+'logo_branco.png'); r=130/lg.height; lg=lg.resize((int(lg.width*r),130),Image.LANCZOS)
c.paste(lg,((W-lg.width)//2,150),lg)
f1=font(46,700); t='Ofertas da sua cidade'
f2=font(34,500,'Onest.ttf'); t2='Cupom grátis no WhatsApp. Use na loja.'
for txt,ft,y in [(t,f1,320),(t2,f2,388)]:
    w=d.textlength(txt,font=ft); d.text(((W-w)/2,y),txt,font=ft,fill=(255,255,255))
# pill clilin.com
f3=font(30,700); t3='clilin.com'; w=d.textlength(t3,font=f3)
bx=(W-w)/2-34; d.rounded_rectangle([bx,458,bx+w+68,520],radius=31,fill=D)
d.text(((W-w)/2,467),t3,font=f3,fill=(255,255,255))
c.save('capa.png')
