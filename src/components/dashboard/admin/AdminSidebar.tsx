import { 
  BarChart3, 
  Users, 
  Megaphone, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Landmark, 
  Ban, 
  Shield, 
  Tags, 
  FileText,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Search,
  MessageCircle,
  Target,
  ClipboardCheck,
  UserCheck,
  Trophy,
  Coins,

  ClipboardList,
} from 'lucide-react';
import { SHOW_REACH_CAMPAIGNS } from '@/lib/reach';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type AdminSection =
  | 'home'
  | 'review-posts'
  | 'review-accounts'
  | 'campaigns'
  | 'prizes'
  | 'credits'
  | 'reach-finance'
  | 'overview'
  | 'analytics'
  | 'users'
  | 'offers'
  | 'leads'
  | 'transactions'
  | 'payments'
  | 'withdrawals'
  | 'financeiro'
  | 'fraud'
  | 'security'
  | 'niches'
  | 'cities'
  | 'pre-cadastros'
  | 'blog'
  | 'seo'
  | 'wa-templates';

/** Contadores que aparecem ao lado dos itens que pedem ação */
export type AdminBadges = Partial<Record<AdminSection, number>>;

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  badges?: AdminBadges;
}

// Modelo principal: ofertas locais com cupom. As campanhas de alcance (Onda)
// ficam guardadas e só aparecem quando SHOW_REACH_CAMPAIGNS for ligado.
const couponGroups = [
  {
    label: 'Hoje',
    icon: LayoutDashboard,
    items: [
      { id: 'overview' as AdminSection, label: 'Painel', icon: LayoutDashboard },
      { id: 'withdrawals' as AdminSection, label: 'Saques', icon: Banknote },
    ]
  },
  {
    label: 'Ofertas e cupons',
    icon: Megaphone,
    items: [
      { id: 'offers' as AdminSection, label: 'Ofertas', icon: Megaphone },
      { id: 'analytics' as AdminSection, label: 'Resultados das ofertas', icon: BarChart3 },
      { id: 'credits' as AdminSection, label: 'Créditos das empresas', icon: Coins },
      { id: 'financeiro' as AdminSection, label: 'Financeiro', icon: Landmark },
      { id: 'wa-templates' as AdminSection, label: 'WhatsApp', icon: MessageCircle },
      { id: 'niches' as AdminSection, label: 'Nichos', icon: Tags },
    ]
  },
  {
    label: 'Gestão',
    icon: Users,
    items: [
      { id: 'users' as AdminSection, label: 'Usuários', icon: Users },
      { id: 'pre-cadastros' as AdminSection, label: 'Pré-cadastros', icon: ClipboardList },
      { id: 'transactions' as AdminSection, label: 'Transações', icon: DollarSign },
      { id: 'payments' as AdminSection, label: 'Pagamentos online', icon: CreditCard },
    ]
  },
  {
    label: 'Segurança',
    icon: Shield,
    items: [
      { id: 'fraud' as AdminSection, label: 'Anti-Fraude', icon: Ban },
      { id: 'security' as AdminSection, label: 'Configurações', icon: Shield },
    ]
  },
  {
    label: 'Site',
    icon: FileText,
    items: [
      { id: 'blog' as AdminSection, label: 'Blog', icon: FileText },
      { id: 'seo' as AdminSection, label: 'SEO / Google', icon: Search },
      { id: 'cities' as AdminSection, label: 'Cidades', icon: MapPin },
    ]
  },
];

const reachGroup = {
  label: 'Campanhas de alcance (guardado)',
  icon: Target,
  items: [
    { id: 'home' as AdminSection, label: 'Início das campanhas', icon: LayoutDashboard },
    { id: 'review-posts' as AdminSection, label: 'Conferir posts', icon: ClipboardCheck },
    { id: 'review-accounts' as AdminSection, label: 'Aprovar perfis', icon: UserCheck },
    { id: 'campaigns' as AdminSection, label: 'Campanhas', icon: Target },
    { id: 'prizes' as AdminSection, label: 'Prêmios do mês', icon: Trophy },
    { id: 'reach-finance' as AdminSection, label: 'Financeiro das campanhas', icon: Landmark },
  ]
};

const menuGroups = SHOW_REACH_CAMPAIGNS ? [...couponGroups, reachGroup] : couponGroups;

export function AdminSidebar({ currentSection, onSectionChange, badges = {} }: AdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const isGroupActive = (items: typeof menuGroups[0]['items']) => 
    items.some(item => item.id === currentSection);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-2">
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = isGroupActive(group.items);
          
          return (
            <SidebarGroup key={group.label}>
              <Collapsible defaultOpen={groupActive || group.label === 'Hoje' || group.label === 'Operação'}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className={cn(
                    "flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors",
                    groupActive && "text-primary font-semibold"
                  )}>
                    <div className="flex items-center gap-2">
                      <GroupIcon className={cn("h-4 w-4", groupActive && "text-primary")} />
                      {!isCollapsed && <span>{group.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = currentSection === item.id;
                        
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              onClick={() => onSectionChange(item.id)}
                              isActive={isActive}
                              tooltip={isCollapsed ? item.label : undefined}
                              className={cn(
                                "transition-colors",
                                isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                              )}
                            >
                              <ItemIcon className={cn("h-4 w-4", isActive && "text-primary")} />
                              {!isCollapsed && <span className="flex-1">{item.label}</span>}
                              {!isCollapsed && (badges[item.id] ?? 0) > 0 && (
                                <span className="ml-auto rounded-full bg-affiliate text-affiliate-foreground text-[10px] font-semibold px-1.5 min-w-[1.25rem] text-center">
                                  {badges[item.id]}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
