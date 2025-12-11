export type AppRole = 'COMPANY' | 'AFFILIATE' | 'CLIENT' | 'ADMIN';
export type LinkType = 'WHATSAPP' | 'MENU' | 'SITE';
export type TransactionType = 'DEPOSIT' | 'CLICK_COST' | 'CLICK_EARNING' | 'WITHDRAW' | 'PLATFORM_FEE';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  city: string;
  balance: number;
  pix_key?: string;
  preferences?: string[];
  instagram_url?: string;
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
  active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined fields
  profiles?: {
    name: string;
    instagram_url?: string;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
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

// Business constants
export const CONFIG = {
  CREDIT_VALUE_BRL: 0.10,
  CPC_COST_COMPANY: 5,
  CPC_PAYOUT_AFFILIATE: 3,
  CPC_PLATFORM_PROFIT: 2,
  MIN_WITHDRAW_BRL: 30.00,
  TIME_TO_INTERACTIVE: 1500,
} as const;

// Helper to format credits to BRL
export const formatCreditsToReal = (credits: number): string => {
  const value = credits * CONFIG.CREDIT_VALUE_BRL;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Helper to format just credits
export const formatCredits = (credits: number): string => {
  return `${credits} C$`;
};