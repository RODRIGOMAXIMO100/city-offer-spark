// Campanhas de alcance (rede de divulgadores premiados por ranking).
// As tabelas e RPCs abaixo ainda nao estao no types.ts auto-gerado, entao usamos
// um client sem tipagem de schema e tipos manuais aqui.
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reachDb = supabase as unknown as SupabaseClient<any, 'public', any>;

export type ReachNetwork = 'INSTAGRAM' | 'TIKTOK' | 'KWAI' | 'FACEBOOK' | 'YOUTUBE' | 'X';
export type ReachLeague = 'BRONZE' | 'PRATA' | 'OURO';
export type CampaignStatus = 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Vídeo curto primeiro: é onde a visualização é o número que a própria rede mostra.
// Facebook e X entram como redes secundárias, conferidas pelo print.
export const REACH_NETWORKS: { id: ReachNetwork; label: string; hint: string; secondary?: boolean }[] = [
  { id: 'TIKTOK', label: 'TikTok', hint: 'Vídeo' },
  { id: 'INSTAGRAM', label: 'Instagram', hint: 'Reels ou post no feed' },
  { id: 'YOUTUBE', label: 'YouTube Shorts', hint: 'Short' },
  { id: 'KWAI', label: 'Kwai', hint: 'Vídeo' },
  { id: 'FACEBOOK', label: 'Facebook', hint: 'Reels ou post, conferido pelo print', secondary: true },
  { id: 'X', label: 'X (Twitter)', hint: 'Post, conferido pelo print', secondary: true },
];

export const networkLabel = (n: string) =>
  REACH_NETWORKS.find((x) => x.id === n)?.label ?? n;

export const LEAGUES: Record<ReachLeague, { label: string; range: string }> = {
  BRONZE: { label: 'Bronze', range: 'até 1 mil seguidores' },
  PRATA: { label: 'Prata', range: 'de 1 mil a 5 mil seguidores' },
  OURO: { label: 'Ouro', range: 'acima de 5 mil seguidores' },
};

export const leagueFor = (followers: number): ReachLeague =>
  followers < 1000 ? 'BRONZE' : followers <= 5000 ? 'PRATA' : 'OURO';

export interface ReachConfig {
  cpm_cents: number;
  prize_share: number;
  min_goal_views: number;
  min_cycle_points: number;
  prizes_cents: number[];
  // Regras da onda
  count_days: number;        // dias de contagem das visualizações de cada post
  post_cap_share: number;    // teto por post (parte do valor reservado)
  early_hours: number;       // primeiras horas da janela que dão bônus
  early_bonus: number;       // bônus nos pontos de quem posta cedo
  max_window_days: number;   // janela máxima de postagem
}

export const DEFAULT_REACH_CONFIG: ReachConfig = {
  cpm_cents: 500,
  prize_share: 0.35,
  min_goal_views: 20000,
  min_cycle_points: 2000,
  prizes_cents: [15000, 8000, 5000],
  count_days: 7,
  post_cap_share: 0.2,
  early_hours: 12,
  early_bonus: 0.2,
  max_window_days: 7,
};

// Duração da janela da onda (todo mundo posta nesse período)
export const WINDOW_PRESETS: { hours: number; label: string }[] = [
  { hours: 24, label: '24 horas' },
  { hours: 48, label: '48 horas' },
  { hours: 72, label: '3 dias' },
  { hours: 168, label: '7 dias' },
];
export const DEFAULT_WINDOW_HOURS = 48;

export interface Campaign {
  id: string;
  company_id: string;
  title: string;
  keyword: string;
  briefing: string | null;
  kit_url: string | null;
  networks: ReachNetwork[];
  cities: string[];
  goal_views: number;
  cpm_cents: number;
  reserved_cents: number;
  spent_cents: number;
  refunded_cents: number;
  verified_views: number;
  starts_at: string;
  ends_at: string;
  status: CampaignStatus;
  finished_at: string | null;
  created_at: string;
}

export interface CampaignPost {
  id: string;
  campaign_id: string;
  affiliate_id: string;
  social_account_id: string | null;
  network: ReachNetwork;
  post_url: string;
  reported_views: number;
  proof_path: string | null;
  verified_views: number | null;
  billed_views: number;
  count_at: string;
  early_bonus: boolean;
  capped: boolean;
  final_check_at: string | null;
  billed_cents: number;
  pool_cents: number;
  points: number;
  status: PostStatus;
  auto_check: AutoCheck;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface AutoCheck {
  checked_at?: string;
  method?: string;
  exists?: boolean | null;
  author?: string | null;
  author_matches?: boolean | null;
  caption?: string | null;
  has_keyword?: boolean | null;
  has_publi?: boolean | null;
  views?: number | null;
  note?: string | null;
  final?: boolean;
}

export interface SocialAccount {
  id: string;
  affiliate_id: string;
  network: ReachNetwork;
  handle: string;
  profile_url: string | null;
  followers: number;
  verified: boolean;
}

export interface Mission {
  id: string;
  title: string;
  keyword: string;
  briefing: string | null;
  kit_url: string | null;
  networks: ReachNetwork[];
  cities: string[];
  starts_at: string;
  ends_at: string;
  goal_views: number;
  verified_views: number;
  company_name: string;
  company_avatar: string | null;
  my_posts: { id: string; network: ReachNetwork; status: PostStatus; post_url: string; points: number; count_at?: string; early_bonus?: boolean }[];
}

export interface RankingRow {
  league: ReachLeague;
  rank_position: number;
  display_name: string;
  points: number;
  is_me: boolean;
  reached_goal: boolean;
}

export interface PrizeCycle {
  id: string;
  period_start: string;
  status: 'OPEN' | 'CLOSED';
  pool_cents: number;
  carried_in_cents: number;
  paid_cents: number;
  closed_at: string | null;
}

// Custo da meta em centavos (mesma conta do banco: arredonda para cima)
export const reserveForGoal = (goalViews: number, cpmCents: number) =>
  Math.ceil((goalViews * cpmCents) / 1000);

export const formatViews = (n: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(n ?? 0);

export const formatMonth = (isoDate: string) => {
  const [y, m] = isoDate.slice(0, 10).split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

// Mensagem legivel a partir do erro do Supabase (RAISE EXCEPTION vem em .message)
export const reachErrorMessage = (err: unknown, fallback = 'Algo deu errado. Tente de novo.') => {
  if (!err) return fallback;
  const msg = (err as { message?: string }).message;
  return msg && msg.length < 300 ? msg : fallback;
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  PENDING: 'Em conferência',
  APPROVED: 'Aprovado',
  REJECTED: 'Não aprovado',
};

// Post pendente ainda dentro dos dias de contagem das visualizações
export const isCounting = (p: { status: PostStatus; count_at?: string | null }) =>
  p.status === 'PENDING' && !!p.count_at && new Date(p.count_at).getTime() > Date.now();

export const postStatusLabel = (p: { status: PostStatus; count_at?: string | null }) =>
  isCounting(p) ? 'Contando visualizações' : POST_STATUS_LABEL[p.status];

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  ACTIVE: 'Ativa',
  FINISHED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

// Sobe o print das visualizacoes para o bucket privado (pasta do proprio usuario)
export async function uploadProof(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Envie uma imagem (print da tela).');
  if (file.size > 5 * 1024 * 1024) throw new Error('O print pode ter no máximo 5 MB.');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${userId}/${crypto.randomUUID()}.${ext || 'png'}`;
  const { error } = await supabase.storage.from('post-proofs').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

// Modelo principal: ofertas locais com cupom (por cidade), validado na loja.
export const SHOW_COUPON_OFFERS = true;
// Campanhas de alcance (Onda): guardadas, fora do ar por enquanto.
export const SHOW_REACH_CAMPAIGNS = false;
