import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Cartão discreto da MAXIMO Empresas (mesmo grupo do Clilin) no painel da empresa.
// Só texto: a identidade visual da MAXIMO não é recriada aqui.
const MAXIMO_EMPRESAS_URL =
  "https://www.maximoacelera.com.br/empresas/?utm_source=clilin&utm_medium=painel_empresa&utm_campaign=clilin";

export function MaximoEmpresasCard() {
  return (
    <Card className="border-border bg-muted/40">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Grupo MAXIMO</p>
          <p className="font-display font-semibold text-foreground">Quer vender ainda mais?</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            A MAXIMO Empresas, do mesmo grupo do Clilin, cuida da gestão, do marketing e das vendas do seu negócio junto com você.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={MAXIMO_EMPRESAS_URL} target="_blank" rel="noopener">
            Conhecer a MAXIMO Empresas <ArrowRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
