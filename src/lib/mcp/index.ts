import { auth, defineMcp } from "@lovable.dev/mcp-js";

import whoami from "./tools/whoami";
import listOffers from "./tools/list-offers";
import listMyOffers from "./tools/list-my-offers";
import setOfferActive from "./tools/set-offer-active";
import listMyLeads from "./tools/list-my-leads";
import listMyCoupons from "./tools/list-my-coupons";
import getMyEarnings from "./tools/get-my-earnings";
import adminOverview from "./tools/admin-overview";

// Direct Supabase issuer, construído a partir do project ref para o token ser aceito.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "clilin-mcp",
  title: "Clilin",
  version: "0.1.0",
  instructions:
    "Ferramentas do Clilin (plataforma de ofertas locais). Use `whoami` primeiro para descobrir o papel do usuário. Empresas podem ver/pausar ofertas, ler leads e cupons. Divulgadores veem saldo e transações. Admins têm um overview geral. Todas as ações respeitam as permissões do usuário logado (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoami,
    listOffers,
    listMyOffers,
    setOfferActive,
    listMyLeads,
    listMyCoupons,
    getMyEarnings,
    adminOverview,
  ],
});
