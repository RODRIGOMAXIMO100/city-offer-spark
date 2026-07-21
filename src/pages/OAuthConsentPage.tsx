import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNoIndex } from "@/components/seo/NoIndex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import logoImg from "@/assets/logo.png";

// Wrapper tipado para os métodos beta do Supabase auth.oauth
type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauthApi = (supabase.auth as unknown as { oauth: OAuthAPI }).oauth;

export default function OAuthConsentPage() {
  useNoIndex();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Parâmetro authorization_id ausente na URL.");
        setLoading(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error: dErr } = await oauthApi.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (dErr) {
          setError(dErr.message ?? "Falha ao carregar autorização.");
          setLoading(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        setError(e?.message ?? "Erro inesperado.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error: dErr } = approve
        ? await oauthApi.approveAuthorization(authorizationId)
        : await oauthApi.denyAuthorization(authorizationId);
      if (dErr) {
        setError(dErr.message ?? "Falha ao processar decisão.");
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("O servidor de autorização não retornou uma URL de redirecionamento.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message ?? "Erro inesperado.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logoImg} alt="Clilin" className="h-12 mx-auto" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Autorizar acesso à sua conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">
                Não foi possível carregar esta autorização: {error}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {details?.client?.name ?? details?.client?.client_name ?? "Um aplicativo externo"}
                  </span>{" "}
                  quer acessar sua conta do Clilin.
                </p>
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Redirecionamento:</span>{" "}
                    <span className="font-mono text-xs break-all">
                      {details?.client?.redirect_uris?.[0] ?? details?.redirect_uri ?? "—"}
                    </span>
                  </p>
                  {details?.scope && (
                    <p>
                      <span className="text-muted-foreground">Escopos:</span>{" "}
                      <span className="font-mono text-xs">{details.scope}</span>
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  O aplicativo agirá como você. As permissões e as regras do Clilin (RLS) continuam
                  valendo — ele só consegue ver e fazer o que você mesmo consegue.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => decide(false)}
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
