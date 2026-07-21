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
    "Ferramentas do Clilin (plataforma de ofertas locais). Use `whoami` primeiro para descobrir o papel do usuário. Todas as ações respeitam RLS: admins têm alcance total, empresas mexem só nas próprias ofertas/leads/cupons, divulgadores veem seu saldo. Operações destrutivas (ban, delete, ajuste de saldo, aprovar saque) devem ser confirmadas com o usuário antes de executar.",
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
