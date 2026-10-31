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

export const REACH_NETWORKS: { id: ReachNetwork; label: string; hint: string }[] = [
  { id: 'INSTAGRAM', label: 'Instagram', hint: 'Reels ou post no feed' },
  { id: 'TIKTOK', label: 'TikTok', hint: 'Vídeo' },
  { id: 'KWAI', label: 'Kwai', hint: 'Vídeo' },
  { id: 'YOUTUBE', label: 'YouTube Shorts', hint: 'Short' },
  { id: 'FACEBOOK', label: 'Facebook', hint: 'Post ou Reels' },
  { id: 'X', label: 'X (Twitter)', hint: 'Post' },
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
}

export const DEFAULT_REACH_CONFIG: ReachConfig = {
  cpm_cents: 500,
  prize_share: 0.35,
  min_goal_views: 20000,
  min_cycle_points: 2000,
  prizes_cents: [15000, 8000, 5000],
};

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
  my_posts: { id: string; network: ReachNetwork; status: PostStatus; post_url: string; points: number }[];
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

// Mostra cupons/ofertas do modelo anterior. Desligado enquanto o Clilin
// lanca as campanhas de alcance; volta como tipo de campanha depois.
export const SHOW_COUPON_OFFERS = false;
