export type AppRole = 'COMPANY' | 'AFFILIATE' | 'CLIENT' | 'ADMIN';
export type LinkType = 'WHATSAPP' | 'MENU' | 'SITE';
export type TransactionType = 'DEPOSIT' | 'CLICK_COST' | 'CLICK_EARNING' | 'WITHDRAW' | 'PLATFORM_FEE' | 'LEAD_COST' | 'LEAD_EARNING';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  city: string;
  balance: number; // Em centavos
  pix_key?: string;
  preferences?: string[];
  instagram_url?: string;
  avatar_url?: string;
  // Dados fiscais (empresa)
  cnpj?: string;
  razao_social?: string;
  endereco_fiscal?: string;
  cep?: string;
  telefone?: string;
  // Dados pagamento (afiliado)
  cpf?: string;
  nome_completo?: string;
  pix_tipo?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Offer {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  price_old: number;
  price_new: number;
  link_destination: string;
  link_type: LinkType;
  tags: string[];
  city: string;
  views_count: number;
  clicks_count: number;
  leads_count?: number;
  active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Dynamic pricing fields
  max_cpc_bid: number;
  current_offer_score: number;
  // Joined fields
  profiles?: {
    name: string;
    instagram_url?: string;
    avatar_url?: string;
  };
}

export interface Lead {
  id: string;
  offer_id: string;
  affiliate_id: string | null;
  name: string;
  phone_whatsapp: string;
  client_ip?: string;
  user_agent?: string;
  device_id?: string;
  fingerprint_hash?: string;
  session_token?: string;
  is_valid: boolean;
  created_at: string;
  // Joined fields
  offers?: {
    title: string;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number; // Em centavos
  type: TransactionType;
  description?: string;
  offer_id?: string;
  created_at: string;
}

export interface OfferClick {
  id: string;
  offer_id: string;
  affiliate_id?: string;
  client_ip?: string;
  user_agent?: string;
  click_type?: 'MAIN' | 'INSTAGRAM';
  created_at: string;
}

// Business constants - TODOS OS VALORES MONETÁRIOS EM CENTAVOS
export const CONFIG = {
  // CPC (clique) - modelo antigo, mantido para compatibilidade
  MIN_CPC: 40,           // R$ 0,40 em centavos
  MAX_CPC: 100,          // R$ 1,00 em centavos
  DEFAULT_CPC: 70,       // R$ 0,70 em centavos
  
  // CPL (lead) - modelo novo
  MIN_CPL: 100,          // R$ 1,00 em centavos
  MAX_CPL: 300,          // R$ 3,00 em centavos
  DEFAULT_CPL: 150,      // R$ 1,50 em centavos
  
  AFFILIATE_SHARE: 0.30, // 30% base para divulgador (pode chegar a 50% com níveis)
  MAX_AFFILIATE_SHARE: 0.50, // 50% máximo no nível Ouro
  
  // Para analytics admin - estimativas médias em centavos
  CPC_PLATFORM_PROFIT: 49,  // ~70% do CPC médio (base 30% para afiliado)
  CPC_PAYOUT_AFFILIATE: 21, // ~30% do CPC médio (base)
  CPL_PLATFORM_PROFIT: 105, // ~70% do CPL médio
  CPL_PAYOUT_AFFILIATE: 45, // ~30% do CPL médio
  
  MIN_WITHDRAW_BRL: 100.00, // R$ 100 (valor em reais para comparação)
  MIN_DEPOSIT_BRL: 100.00,  // R$ 100 (valor em reais para comparação)
  MIN_WITHDRAW_CENTS: 10000, // R$ 100 em centavos
  MIN_DEPOSIT_CENTS: 10000,  // R$ 100 em centavos
  TIME_TO_INTERACTIVE: 1500,
} as const;

// Disclaimers de preço centralizados
export const PRICING_DISCLAIMER = {
  short: "Valores atuais, sujeitos a alteração.",
  full: "Valores promocionais válidos para o período de lançamento. A Clilin reserva-se o direito de ajustar valores a qualquer momento.",
  marketplaceNote: "Comissão média cobrada por apps de delivery sobre cada venda realizada",
  searchAdsNote: "Custo médio por clique em anúncios de busca pagos",
} as const;

// Terminologia de Lead Qualificado centralizada
export const LEAD_TERMINOLOGY = {
  name: "Lead Qualificado",
  shortDescription: "Cliente local com interesse demonstrado",
  channels: {
    ai: "Via Assistente IA — cliente pediu ativamente",
    affiliate: "Via Divulgador — indicação local de confiança"
  },
  differentiator: "Você não paga por impressões ou cliques genéricos. Cada lead é local, segmentado e demonstrou interesse real.",
  comparisonNote: "Diferente de anúncios tradicionais, na Clilin você paga apenas quando alguém demonstra interesse real na sua oferta."
} as const;

// Helper para formatar centavos para R$
export const formatCentsToBRL = (cents: number): string => {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Alias para compatibilidade - TODOS USAM A MESMA LÓGICA AGORA
export const formatBalance = formatCentsToBRL;
export const formatCredits = formatCentsToBRL;
export const formatCreditsToReal = formatCentsToBRL;
