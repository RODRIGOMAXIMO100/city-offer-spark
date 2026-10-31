import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, Bell, MessageCircle, MapPin } from "lucide-react";
import { ComingSoonWaitlist } from "./ComingSoonWaitlist";

export function HomeComingSoon() {
  const [open, setOpen] = useState(false);

  return (
    <section id="em-breve" className="section-padding">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-card p-8 sm:p-12">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-client/10 blur-3xl" aria-hidden />
          <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-client/10 text-client px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-4">
                <Ticket className="h-4 w-4" /> Em breve
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">Ofertas e cupons da sua cidade</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Estamos preparando um espaço para você achar descontos dos negócios locais e pegar o cupom direto no WhatsApp.
                Deixe seu contato e seja o primeiro a saber.
              </p>
              <Button onClick={() => setOpen(true)} className="bg-client text-client-foreground hover:bg-client/90">
                <Bell className="h-4 w-4 mr-2" /> Quero ser avisado
              </Button>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                { icon: MapPin, t: "Descontos de quem está perto de você" },
                { icon: MessageCircle, t: "Cupom chega no seu WhatsApp" },
                { icon: Ticket, t: "Sem custo para quem usa" },
              ].map((i) => (
                <li key={i.t} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <i.icon className="h-5 w-5 text-client shrink-0" />
                  {i.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <ComingSoonWaitlist open={open} onOpenChange={setOpen} />
    </section>
  );
}
