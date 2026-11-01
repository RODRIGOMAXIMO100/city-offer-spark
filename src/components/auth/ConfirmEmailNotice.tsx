import { MailCheck } from "lucide-react";

/** Aviso mostrado logo depois do cadastro, enquanto a pessoa não confirma o e-mail */
export function ConfirmEmailNotice({ email }: { email: string }) {
  return (
    <div className="rounded-2xl border border-company/20 bg-company/5 p-5 text-center space-y-3">
      <span className="mx-auto h-12 w-12 rounded-2xl bg-company text-company-foreground flex items-center justify-center">
        <MailCheck className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-display font-bold text-foreground">Confirme seu e-mail</h3>
      <p className="text-sm text-muted-foreground">
        Sua conta foi criada. Mandamos um link para <strong className="text-foreground">{email}</strong>. Clique nele para ativar a conta e entrar no seu
        painel.
      </p>
      <p className="text-xs text-muted-foreground">Não chegou em alguns minutos? Olhe a caixa de spam ou promoções.</p>
    </div>
  );
}
