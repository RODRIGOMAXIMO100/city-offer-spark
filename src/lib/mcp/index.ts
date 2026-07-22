import { auth, defineMcp } from "@lovable.dev/mcp-js";

import whoami from "./tools/whoami";
import listOffers from "./tools/list-offers";
import listMyOffers from "./tools/list-my-offers";
import setOfferActive from "./tools/set-offer-active";
import listMyLeads from "./tools/list-my-leads";
import listMyCoupons from "./tools/list-my-coupons";
import getMyEarnings from "./tools/get-my-earnings";
import adminOverview from "./tools/admin-overview";

// Write tools
import createOffer from "./tools/create-offer";
import updateOffer from "./tools/update-offer";
import deleteOffer from "./tools/delete-offer";
import listCompanies from "./tools/list-companies";
import findCompany from "./tools/find-company";
import listAffiliates from "./tools/list-affiliates";
import adjustUserBalance from "./tools/adjust-user-balance";
import setUserBanned from "./tools/set-user-banned";
import setBalanceFrozen from "./tools/set-balance-frozen";
import listWithdrawals from "./tools/list-withdrawals";
import setWithdrawalStatus from "./tools/set-withdrawal-status";
import listCities from "./tools/list-cities";
import setCityActive from "./tools/set-city-active";
import listBlogPosts from "./tools/list-blog-posts";
import publishBlogPost from "./tools/publish-blog-post";
import addMerchantWhatsapp from "./tools/add-merchant-whatsapp";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "clilin-mcp",
  title: "Clilin",
  version: "0.2.0",
  instructions:
    "Ferramentas do Clilin (plataforma de ofertas locais). Comece SEMPRE com `whoami` para descobrir o papel do usuário logado (ADMIN/COMPANY/AFFILIATE/CLIENT). IDs importantes: `profiles.id` é o `company_id`/`affiliate_id` usado em quase tudo — use `find_company` (busca por nome/CNPJ) ou `list_companies` para descobrir o UUID de uma empresa. ADMIN tem acesso irrestrito: pode criar/editar/deletar ofertas de QUALQUER empresa passando `company_id` em create_offer, ajustar saldos, banir usuários, aprovar saques, ativar cidades etc. Empresas (COMPANY) só mexem nas próprias ofertas (omitem company_id). Divulgadores (AFFILIATE) veem seu saldo. Todas as ações respeitam RLS. Operações destrutivas (ban, delete, ajuste de saldo, aprovar saque, publicar post) devem ser confirmadas antes de executar.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    // Leitura
    whoami,
    listOffers,
    listMyOffers,
    listMyLeads,
    listMyCoupons,
    getMyEarnings,
    adminOverview,
    listCompanies,
    findCompany,
    listAffiliates,
    listWithdrawals,
    listCities,
    listBlogPosts,
    // Escrita
    setOfferActive,
    createOffer,
    updateOffer,
    deleteOffer,
    adjustUserBalance,
    setUserBanned,
    setBalanceFrozen,
    setWithdrawalStatus,
    setCityActive,
    publishBlogPost,
    addMerchantWhatsapp,
  ],
});
