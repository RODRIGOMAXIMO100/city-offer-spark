import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Check, MapPin, LineChart, BadgeCheck, Wallet } from "lucide-react";

// Mesma regra do banco: 15% do preço da oferta por cupom usado, mínimo de R$ 3
// (pricing_config.fee_percent / fee_min_cents); pré-pago com 10% de desconto.
export const COUPON_EXAMPLES = [
  { offer: "R$ 15", what: "Açaí 500 ml", fee: "R$ 3,00", note: "Taxa mínima" },
  { offer: "R$ 39", what: "Pizza grande", fee: "R$ 5,85", note: "15% do preço", featured: true },
  { offer: "R$ 80", what: "Corte e escova", fee: "R$ 12,00", note: "15% do preço" },
  { offer: "R$ 120", what: "Mês de academia", fee: "R$ 18,00", note: "15% do preço" },
];

const perks = [
  { icon: MapPin, text: "Sua oferta aparece para quem é da sua cidade" },
  { icon: BadgeCheck, text: "Você confere cada código no painel antes de dar o desconto" },
  { icon: LineChart, text: "Veja quantos viram, quantos pegaram o cupom e quantos vieram" },
  { icon: Wallet, text: "Sem mensalidade: coloque saldo e pague só pelos cupons usados" },
];

export function HomeForCompanies() {
  return (
    <section id="empresas" className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-br from-company/5 via-transparent to-transparent" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 bg-company/10 text-company px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Building2 className="h-4 w-4" />
              Para negócios locais
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5">
              Promoção que <span className="text-company">enche a loja</span>, não só o feed
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Restaurante, salão, academia, loja: você cria a oferta, a cidade fica sabendo e o cliente chega com o cupom na mão.
              Você só paga quando confere o código e o cupom é usado.
            </p>
            <ul className="space-y-4 mb-8">
              {perks.map((p) => (
                <li key={p.text} className="flex gap-3 items-start">
                  <span className="w-10 h-10 rounded-xl bg-company/10 text-company flex items-center justify-center shrink-0">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="pt-2">{p.text}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="h-12 sm:h-14 px-6 sm:px-8 bg-company text-company-foreground hover:bg-company/90 shadow-xl shadow-company/25">
              <Link to="/auth?role=COMPANY">
                Colocar minha oferta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <p className="sm:col-span-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quanto custa cada cliente na loja</p>
            {COUPON_EXAMPLES.map((p) => (
              <div
                key={p.what}
                className={`rounded-3xl p-6 border transition-shadow hover:shadow-xl ${
                  p.featured ? "bg-company text-company-foreground border-company shadow-xl shadow-company/20" : "bg-card border-border"
                }`}
              >
                <p className={`text-sm ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>Oferta de {p.offer}</p>
                <p className="font-display font-semibold text-lg mb-3">{p.what}</p>
                <p className="font-display font-bold text-4xl leading-none">{p.fee}</p>
                <p className={`text-sm mt-1 flex items-center gap-1.5 ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>
                  <Check className="h-4 w-4" /> por cupom usado · {p.note}
                </p>
              </div>
            ))}
            <p className="sm:col-span-2 text-sm text-muted-foreground text-center">
              Com saldo pré-pago, cada cupom sai 10% mais barato. Cupom pego e não usado não custa nada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
