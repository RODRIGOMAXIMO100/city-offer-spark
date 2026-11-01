import { Sparkles } from "lucide-react";

/** Aviso do próximo módulo (ofertas, cupons e captação de clientes), que volta quando SHOW_COUPON_OFFERS for ligado */
export function ComingSoonLeadsCard({ role }: { role: "company" | "affiliate" }) {
  const text =
    role === "company"
      ? "Ofertas e cupons divulgados pela rede para levar clientes novos até a sua empresa. Você vai ser avisado aqui quando lançar."
      : "Ofertas e cupons das empresas da sua cidade para você divulgar. Você vai ser avisado aqui quando lançar.";
  return (
    <div className="rounded-2xl border border-dashed border-client/40 bg-client/5 p-4 flex items-start gap-3">
      <span className="h-9 w-9 rounded-xl bg-client/15 text-client flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-client">Em breve</p>
        <p className="font-semibold text-foreground text-sm">Captação de clientes</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
