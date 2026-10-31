import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Check, MapPin, LineChart, RotateCcw } from "lucide-react";

// Mesma regra do banco: R$ 5 a cada mil visualizações (reach_cpm_cents = 500)
export const REACH_PLANS = [
  { name: "Largada", views: "20 mil", price: "R$ 100", note: "Para testar com o pé direito" },
  { name: "Cidade", views: "50 mil", price: "R$ 250", note: "Sua cidade falando de você", featured: true },
  { name: "Região", views: "100 mil", price: "R$ 500", note: "Várias cidades ao mesmo tempo" },
  { name: "Brasil", views: "300 mil", price: "R$ 1.500", note: "Lançamento de peso" },
];

const perks = [
  { icon: MapPin, text: "Escolha as cidades ou o Brasil inteiro" },
  { icon: LineChart, text: "Acompanhe cada post e cada visualização no painel" },
  { icon: RotateCcw, text: "Encerre quando quiser: o que não foi usado volta para o seu saldo" },
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
              Para empresas e marcas
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-5">
              Seu nome falado <span className="text-company">por quem o povo escuta</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Inauguração, lançamento, evento ou o nome da sua marca: você define a palavra-chave e a meta,
              e uma rede de divulgadores coloca o assunto para rodar. Você investe a partir de R$ 100.
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
                Criar minha campanha
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {REACH_PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-6 border transition-shadow hover:shadow-xl ${
                  p.featured ? "bg-company text-company-foreground border-company shadow-xl shadow-company/20" : "bg-card border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-semibold text-lg">{p.name}</span>
                  {p.featured && (
                    <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-highlight text-highlight-foreground">Mais escolhido</span>
                  )}
                </div>
                <p className="font-display font-bold text-4xl leading-none">{p.views}</p>
                <p className={`text-sm mb-4 ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>visualizações verificadas</p>
                <p className="font-display font-bold text-2xl">{p.price}</p>
                <p className={`text-sm mt-1 flex items-center gap-1.5 ${p.featured ? "opacity-80" : "text-muted-foreground"}`}>
                  <Check className="h-4 w-4" /> {p.note}
                </p>
              </div>
            ))}
            <p className="sm:col-span-2 text-sm text-muted-foreground text-center">
              Você também pode montar a sua meta: qualquer valor a partir de 20 mil visualizações, sempre a R$ 5 por mil.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
