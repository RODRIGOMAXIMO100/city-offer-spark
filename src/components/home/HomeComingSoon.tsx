import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ticket, MessageCircle, MapPin, ArrowRight } from "lucide-react";

/** Chamada para quem compra: ver as ofertas da cidade */
export function HomeComingSoon() {
  return (
    <section id="clientes" className="section-padding">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-highlight/15 blur-3xl" aria-hidden />
          <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-4">
                <Ticket className="h-4 w-4" /> Para quem compra
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">Desconto da sua cidade, de graça, no WhatsApp</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Veja as promoções dos negócios perto de você, pegue o cupom e use na loja. Sem app, sem cadastro e sem pagar nada.
              </p>
              <Button asChild>
                <Link to="/ofertas">
                  Ver ofertas da cidade <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                { icon: MapPin, t: "Descontos de quem está perto de você" },
                { icon: MessageCircle, t: "Cupom chega no seu WhatsApp" },
                { icon: Ticket, t: "Grátis para quem usa" },
              ].map((i) => (
                <li key={i.t} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <i.icon className="h-5 w-5 text-primary shrink-0" />
                  {i.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
