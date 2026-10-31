import { useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, Bell, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ComingSoonWaitlist } from "@/components/home/ComingSoonWaitlist";

const ParaClientesPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Ofertas e cupons da sua cidade: em breve"
        description="Em breve no Clilin: descontos de negócios locais com cupom direto no WhatsApp. Entre na lista e seja avisado primeiro."
        canonicalUrl="/clientes"
      />
      <Navbar />

      <main className="flex-1 pt-32 pb-20 sm:pt-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-client/10 text-client px-4 py-2 text-sm font-bold uppercase tracking-wider mb-6">
            <Ticket className="h-4 w-4" /> Em breve
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-5">Ofertas e cupons da sua cidade</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Estamos preparando um espaço para você achar descontos dos negócios perto de você e pegar o cupom direto no WhatsApp,
            sem pagar nada por isso.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {[
              { icon: MapPin, t: "Negócios perto de você" },
              { icon: MessageCircle, t: "Cupom no WhatsApp" },
              { icon: Ticket, t: "Grátis para quem usa" },
            ].map((i) => (
              <div key={i.t} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <i.icon className="h-5 w-5 text-client shrink-0" />
                <span className="font-medium">{i.t}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => setOpen(true)} className="bg-client text-client-foreground hover:bg-client/90">
              <Bell className="h-5 w-5 mr-2" /> Quero ser avisado
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/divulgadores">
                Enquanto isso, ganhe divulgando <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <ComingSoonWaitlist open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default ParaClientesPage;
