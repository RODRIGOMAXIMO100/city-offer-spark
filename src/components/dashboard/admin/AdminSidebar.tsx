import { 
  BarChart3, 
  Users, 
  Megaphone, 
  Phone, 
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

} from 'lucide-react';
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

const menuGroups = [
  {
    label: 'Hoje',
    icon: LayoutDashboard,
    items: [
      { id: 'home' as AdminSection, label: 'Início', icon: LayoutDashboard },
      { id: 'review-posts' as AdminSection, label: 'Conferir posts', icon: ClipboardCheck },
      { id: 'review-accounts' as AdminSection, label: 'Aprovar perfis', icon: UserCheck },
      { id: 'withdrawals' as AdminSection, label: 'Saques', icon: Banknote },
    ]
  },
  {
    label: 'Operação',
    icon: Target,
    items: [
      { id: 'campaigns' as AdminSection, label: 'Campanhas', icon: Target },
      { id: 'prizes' as AdminSection, label: 'Prêmios do mês', icon: Trophy },
      { id: 'credits' as AdminSection, label: 'Créditos das empresas', icon: Coins },
    ]
  },
  {
    label: 'Gestão',
    icon: Users,
    items: [
      { id: 'users' as AdminSection, label: 'Usuários', icon: Users },
      { id: 'reach-finance' as AdminSection, label: 'Financeiro', icon: Landmark },
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
  {
    // Módulo de ofertas, cupons e leads: guardado para o lançamento (em breve no site)
    label: 'Captação (em breve)',
    icon: Megaphone,
    items: [
      { id: 'overview' as AdminSection, label: 'Painel de ofertas', icon: BarChart3 },
      { id: 'analytics' as AdminSection, label: 'Analytics de ofertas', icon: BarChart3 },
      { id: 'offers' as AdminSection, label: 'Ofertas', icon: Megaphone },
      { id: 'leads' as AdminSection, label: 'Leads', icon: Phone },
      { id: 'financeiro' as AdminSection, label: 'Financeiro de ofertas', icon: Landmark },
      { id: 'niches' as AdminSection, label: 'Nichos', icon: Tags },
      { id: 'wa-templates' as AdminSection, label: 'Templates WhatsApp', icon: MessageCircle },
    ]
  },
];

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
