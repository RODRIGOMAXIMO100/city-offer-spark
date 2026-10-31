import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Trophy } from "lucide-react";

export function HomeFinalCTA() {
  return (
    <section className="section-padding">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground p-8 sm:p-14 text-center">
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-highlight/30 blur-3xl" aria-hidden />
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-affiliate/30 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="font-display font-semibold tracking-wide opacity-90 mb-3">Servir. Conectar. Crescer.</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">Bora colocar o seu nome para rodar?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Empresas começam com R$ 100. Divulgadores entram de graça e disputam prêmios todo mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="h-12 sm:h-14 px-6 sm:px-8 bg-background text-foreground hover:bg-background/90">
                <Link to="/auth?role=COMPANY">
                  <Building2 className="mr-2 h-5 w-5" /> Criar minha campanha <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 sm:h-14 px-6 sm:px-8 bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/auth?role=AFFILIATE">
                  <Trophy className="mr-2 h-5 w-5" /> Quero divulgar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
