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
  LayoutDashboard
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
  | 'blog';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const menuGroups = [
  {
    label: 'Visão Geral',
    icon: LayoutDashboard,
    items: [
      { id: 'overview' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics' as AdminSection, label: 'Analytics', icon: BarChart3 },
    ]
  },
  {
    label: 'Gestão',
    icon: Users,
    items: [
      { id: 'users' as AdminSection, label: 'Usuários', icon: Users },
      { id: 'offers' as AdminSection, label: 'Ofertas', icon: Megaphone },
      { id: 'leads' as AdminSection, label: 'Leads', icon: Phone },
    ]
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    items: [
      { id: 'transactions' as AdminSection, label: 'Transações', icon: DollarSign },
      { id: 'payments' as AdminSection, label: 'Pagamentos', icon: CreditCard },
      { id: 'withdrawals' as AdminSection, label: 'Saques', icon: Banknote },
      { id: 'financeiro' as AdminSection, label: 'Resumo', icon: Landmark },
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
    label: 'Configurações',
    icon: Tags,
    items: [
      { id: 'niches' as AdminSection, label: 'Nichos', icon: Tags },
      { id: 'blog' as AdminSection, label: 'Blog', icon: FileText },
    ]
  },
];

export function AdminSidebar({ currentSection, onSectionChange }: AdminSidebarProps) {
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
              <Collapsible defaultOpen={groupActive || group.label === 'Visão Geral'}>
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
                              {!isCollapsed && <span>{item.label}</span>}
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
