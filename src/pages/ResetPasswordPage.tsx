import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNoIndex } from "@/components/seo/NoIndex";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

/** Página aberta pelo link do e-mail "Esqueci minha senha" */
export default function ResetPasswordPage() {
  useNoIndex();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // O link do e-mail traz a sessão de recuperação; o cliente do Supabase lê isso sozinho
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const t = setTimeout(() => setInvalid(true), 6000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Senha curta", description: "Use pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não batem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Senha nova salva", description: "Pronto, você já está dentro." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <BrandLogo className="h-10" />
      </Link>
      <Card className="w-full max-w-md rounded-3xl">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Criar senha nova</h1>
          {!ready && !invalid && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Conferindo o link...
            </p>
          )}
          {!ready && invalid && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Este link expirou ou já foi usado. Peça um novo na tela de entrar, em "Esqueci minha senha".</p>
              <Button asChild className="w-full">
                <Link to="/auth">Ir para entrar</Link>
              </Button>
            </div>
          )}
          {ready && (
            <form onSubmit={save} className="space-y-4">
              <p className="text-muted-foreground">Escolha uma senha com pelo menos 8 caracteres.</p>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha nova</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repita a senha</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar senha nova"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
