// Canais de atendimento do Clilin
export const SUPPORT_WHATSAPP = "5531995118248";
export const SUPPORT_EMAIL = "contato@clilin.com";

export const whatsappLink = (message: string) => `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;

// Pagamento online (Asaas) só liga quando a chave estiver configurada no Supabase e VITE_ONLINE_PAYMENTS=true
export const ONLINE_PAYMENTS = import.meta.env.VITE_ONLINE_PAYMENTS === "true";

// Login com Google só aparece quando o provedor Google estiver ligado no Supabase e VITE_GOOGLE_AUTH=true
export const GOOGLE_AUTH = import.meta.env.VITE_GOOGLE_AUTH === "true";
