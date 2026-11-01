import { useState } from "react";
import { MessageCircle, Coins } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappLink } from "@/lib/contact";

const PLANS = [
  { name: "Largada", reais: 100 },
  { name: "Cidade", reais: 250 },
  { name: "Região", reais: 500 },
  { name: "Brasil", reais: 1500 },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Compra de créditos enquanto o pagamento online não está ligado: pedido pelo WhatsApp e Pix */
export function ManualCreditsDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userName?: string;
  userEmail?: string;
}) {
  const [selected, setSelected] = useState<number>(250);
  const [custom, setCustom] = useState("");

  const customValue = Number(custom.replace(/\./g, "").replace(",", "."));
  const value = custom ? customValue : selected;
  const valid = Number.isFinite(value) && value >= 100;
  const plan = PLANS.find((p) => p.reais === value && !custom);

  const message =
    `Olá! Quero comprar créditos no Clilin.\n` +
    `Empresa: ${userName || "-"}\n` +
    `E-mail da conta: ${userEmail || "-"}\n` +
    `Valor: ${valid ? brl(value) : "-"}${plan ? ` (pacote ${plan.name})` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-company" /> Comprar créditos
          </DialogTitle>
          <DialogDescription>
            1 crédito vale R$ 1 e compra 200 visualizações verificadas. Escolha o valor, fale com a gente no WhatsApp e pague por Pix. Os créditos entram na sua
            conta assim que o pagamento for confirmado, com aviso aqui no painel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {PLANS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setSelected(p.reais);
                setCustom("");
              }}
              className={`rounded-2xl border p-3 text-left transition-colors ${
                !custom && selected === p.reais ? "border-company bg-company/10" : "border-border hover:bg-muted/60"
              }`}
            >
              <p className="text-xs text-muted-foreground">{p.name}</p>
              <p className="font-display font-bold text-foreground">{brl(p.reais)}</p>
              <p className="text-[11px] text-muted-foreground">{(p.reais * 200).toLocaleString("pt-BR")} visualizações</p>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="manual-credit-custom">Outro valor (mínimo R$ 100)</Label>
          <Input id="manual-credit-custom" inputMode="decimal" placeholder="Ex.: 750" value={custom} onChange={(e) => setCustom(e.target.value)} />
        </div>

        <Button asChild={valid} disabled={!valid} className="w-full bg-company text-company-foreground hover:bg-company/90">
          {valid ? (
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Pedir {brl(value)} pelo WhatsApp
            </a>
          ) : (
            <span>Valor mínimo de R$ 100</span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
