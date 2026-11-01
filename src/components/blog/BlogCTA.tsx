import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeCategory } from "@/lib/blog";

/**
 * Chamada no fim (e na lateral) de cada post. Fica no componente, e não dentro do texto,
 * para que os posts antigos e os novos falem sempre do modelo atual do Clilin.
 */
export function BlogCTA({ category }: { category?: string }) {
  const cat = normalizeCategory(category);
  // quem lê sobre divulgação vê primeiro o convite para divulgador
  const affiliateFirst = cat === "divulgadores";

  const company = (
    <div key="company" className="rounded-2xl border border-company/20 bg-company/5 p-6 sm:p-8 flex flex-col">
      <span className="h-11 w-11 rounded-xl bg-company text-company-foreground flex items-center justify-center mb-4">
        <Megaphone className="h-5 w-5" />
      </span>
      <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Tem uma empresa?</h3>
      <p className="text-muted-foreground mb-6 flex-1">
        Publique uma oferta, a cidade fica sabendo e o cliente chega com o cupom no WhatsApp. Você só paga pelo cupom usado: 15% do preço, mínimo de R$ 3.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-company text-company-foreground hover:bg-company/90">
          <Link to="/auth?role=COMPANY">
            Colocar minha oferta <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/empresas">Como funciona</Link>
        </Button>
      </div>
    </div>
  );

  const affiliate = (
    <div key="affiliate" className="rounded-2xl border border-affiliate/20 bg-affiliate/5 p-6 sm:p-8 flex flex-col">
      <span className="h-11 w-11 rounded-xl bg-affiliate text-affiliate-foreground flex items-center justify-center mb-4">
        <Trophy className="h-5 w-5" />
      </span>
      <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Quer ganhar divulgando?</h3>
      <p className="text-muted-foreground mb-6 flex-1">
        Indique as ofertas da sua cidade pelo seu link e ganhe metade da taxa de cada cupom usado, até 70% por nível. Saque no Pix. Entrar é grátis.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-affiliate text-affiliate-foreground hover:bg-affiliate/90">
          <Link to="/auth?role=AFFILIATE">
            Quero ser divulgador <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/divulgadores">Como funciona</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <section className="mt-16" aria-label="Faça parte do Clilin">
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-6 text-center">
        Faça parte do <span className="text-brand-gradient">Clilin</span>
      </h2>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">{affiliateFirst ? [affiliate, company] : [company, affiliate]}</div>
    </section>
  );
}

/** Versão curta para a lateral do post, abaixo do índice */
export function BlogSideCTA({ category }: { category?: string }) {
  const isAffiliate = normalizeCategory(category) === "divulgadores";
  return (
    <div className={`mt-6 rounded-2xl border p-5 ${isAffiliate ? "border-affiliate/20 bg-affiliate/5" : "border-company/20 bg-company/5"}`}>
      <p className="font-display font-bold text-foreground mb-1">
        {isAffiliate ? "Ganhe indicando ofertas" : "Cliente novo na sua loja"}
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        {isAffiliate ? "Comissão por cada cliente que usar o cupom na loja." : "Pague só pelo cupom usado: 15% do preço, mínimo de R$ 3."}
      </p>
      <Button
        asChild
        size="sm"
        className={`w-full ${isAffiliate ? "bg-affiliate text-affiliate-foreground hover:bg-affiliate/90" : "bg-company text-company-foreground hover:bg-company/90"}`}
      >
        <Link to={isAffiliate ? "/auth?role=AFFILIATE" : "/auth?role=COMPANY"}>{isAffiliate ? "Quero indicar" : "Colocar oferta"}</Link>
      </Button>
    </div>
  );
}
