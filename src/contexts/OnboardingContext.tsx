import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Definição dos bônus por tipo de usuário (em centavos)
export type TourStep = {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
};

export type BonusItem = {
  amount: number;
  label: string;
};

export type BonusMap = Record<string, BonusItem>;

export const ONBOARDING_BONUSES: Record<string, BonusMap> = {
  AFFILIATE: {
    tour_completed: { amount: 1000, label: 'Completar o tour' }, // R$10,00
    first_link_copied: { amount: 5, label: 'Copiar primeiro link' },
    first_click: { amount: 10, label: 'Primeiro clique válido' },
    payment_data_filled: { amount: 5, label: 'Preencher dados PIX' },
    ten_clicks: { amount: 20, label: 'Atingir 10 cliques' },
  },
  COMPANY: {
    tour_completed: { amount: 1000, label: 'Completar o tour' }, // R$10,00
    logo_added: { amount: 20, label: 'Adicionar logo' },
    instagram_connected: { amount: 20, label: 'Conectar Instagram' },
    first_offer: { amount: 50, label: 'Criar primeira oferta' },
    first_click: { amount: 10, label: 'Receber primeiro clique' },
  },
  CLIENT: {
    tour_completed: { amount: 1000, label: 'Completar o tour' }, // R$10,00
    first_search: { amount: 0, label: 'Fazer primeira busca' },
  },
};

// Steps do tour por tipo de usuário
export const TOUR_STEPS: Record<string, TourStep[]> = {
  AFFILIATE: [
    {
      target: '[data-tour="balance"]',
      title: 'Seu Saldo',
      content: 'Aqui você vê quanto já ganhou divulgando ofertas. Cada clique válido te dá comissão!',
      position: 'bottom',
    },
    {
      target: '[data-tour="offers"]',
      title: 'Ofertas Disponíveis',
      content: 'Copie o link das ofertas e compartilhe nas redes sociais para ganhar comissão por cada clique.',
      position: 'bottom',
    },
    {
      target: '[data-tour="level"]',
      title: 'Seu Nível',
      content: 'Quanto mais cliques você gera, maior seu nível e maior sua comissão! Suba de nível para ganhar mais.',
      position: 'left',
    },
    {
      target: '[data-tour="withdraw"]',
      title: 'Sacar Dinheiro',
      content: 'Com R$100 ou mais, você pode sacar via PIX instantâneo. Complete seus dados para habilitar.',
      position: 'top',
    },
  ],
  COMPANY: [
    {
      target: '[data-tour="balance"]',
      title: 'Seus Créditos',
      content: 'Adicione créditos para suas ofertas aparecerem. Você só paga por cliques reais!',
      position: 'bottom',
    },
    {
      target: '[data-tour="fiscal-data"]',
      title: 'Dados da Empresa',
      content: 'Complete os dados fiscais da sua empresa para emitir notas fiscais.',
      position: 'bottom',
    },
    {
      target: '[data-tour="create-offer"]',
      title: 'Criar Oferta',
      content: 'Crie ofertas com descontos atrativos. Quanto melhor a oferta, mais cliques você recebe!',
      position: 'left',
    },
    {
      target: '[data-tour="performance"]',
      title: 'Desempenho',
      content: 'Acompanhe views, cliques e CTR das suas ofertas em tempo real.',
      position: 'top',
    },
  ],
  CLIENT: [
    {
      target: '[data-tour="chat"]',
      title: 'Chat Inteligente',
      content: 'Converse com nossa IA para encontrar as melhores ofertas da sua cidade!',
      position: 'bottom',
    },
    {
      target: '[data-tour="location"]',
      title: 'Sua Localização',
      content: 'Diga sua cidade para ver ofertas exclusivas perto de você.',
      position: 'top',
    },
  ],
};

interface OnboardingState {
  isLoading: boolean;
  tourCompleted: boolean;
  tourCurrentStep: number;
  checklistItems: string[];
  bonusEarned: number;
  showTour: boolean;
  showWelcomeModal: boolean;
}

interface OnboardingContextType extends OnboardingState {
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => Promise<void>;
  claimBonus: (bonusType: string) => Promise<boolean>;
  hasClaimedBonus: (bonusType: string) => boolean;
  getTourSteps: () => TourStep[];
  getBonuses: () => BonusMap;
  getChecklistProgress: () => { completed: number; total: number; percentage: number };
  dismissWelcomeModal: () => void;
}
const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    isLoading: true,
    tourCompleted: false,
    tourCurrentStep: 0,
    checklistItems: [],
    bonusEarned: 0,
    showTour: false,
    showWelcomeModal: false,
  });

  // Carregar estado do onboarding
  useEffect(() => {
    if (!user || !role) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const loadOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading onboarding:', error);
          return;
        }

        if (data) {
          const checklistItems = Array.isArray(data.checklist_items) 
            ? data.checklist_items as string[]
            : [];
          
          setState({
            isLoading: false,
            tourCompleted: data.tour_completed || false,
            tourCurrentStep: data.tour_current_step || 0,
            checklistItems,
            bonusEarned: data.bonus_earned || 0,
            showTour: false,
            showWelcomeModal: !data.tour_completed,
          });
        } else {
          // Criar registro de onboarding
          const { error: insertError } = await supabase
            .from('user_onboarding')
            .insert({
              user_id: user.id,
              role: role,
            });

          if (insertError) {
            console.error('Error creating onboarding:', insertError);
          }

          setState({
            isLoading: false,
            tourCompleted: false,
            tourCurrentStep: 0,
            checklistItems: [],
            bonusEarned: 0,
            showTour: false,
            showWelcomeModal: true,
          });
        }
      } catch (err) {
        console.error('Error in loadOnboarding:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadOnboarding();
  }, [user, role]);

  const getTourSteps = useCallback(() => {
    if (!role || role === 'ADMIN') return TOUR_STEPS.AFFILIATE;
    return TOUR_STEPS[role as keyof typeof TOUR_STEPS] || TOUR_STEPS.AFFILIATE;
  }, [role]);

  const getBonuses = useCallback(() => {
    if (!role || role === 'ADMIN') return ONBOARDING_BONUSES.AFFILIATE;
    return ONBOARDING_BONUSES[role as keyof typeof ONBOARDING_BONUSES] || ONBOARDING_BONUSES.AFFILIATE;
  }, [role]);

  const startTour = useCallback(() => {
    setState(prev => ({ ...prev, showTour: true, showWelcomeModal: false, tourCurrentStep: 0 }));
  }, []);

  const nextStep = useCallback(() => {
    const steps = getTourSteps();
    setState(prev => {
      const nextStepNum = prev.tourCurrentStep + 1;
      if (nextStepNum >= steps.length) {
        return prev;
      }
      return { ...prev, tourCurrentStep: nextStepNum };
    });
  }, [getTourSteps]);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      tourCurrentStep: Math.max(0, prev.tourCurrentStep - 1),
    }));
  }, []);

  const skipTour = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, showTour: false, showWelcomeModal: false }));

    await supabase
      .from('user_onboarding')
      .update({ tour_completed: true, tour_current_step: 0 })
      .eq('user_id', user.id);
  }, [user]);

  const completeTour = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, showTour: false, tourCompleted: true }));

    await supabase
      .from('user_onboarding')
      .update({ tour_completed: true, tour_current_step: 0 })
      .eq('user_id', user.id);

    // Creditar bônus do tour
    const bonuses = getBonuses();
    if (bonuses.tour_completed?.amount > 0) {
      const { data } = await supabase.rpc('credit_onboarding_bonus', {
        p_user_id: user.id,
        p_bonus_type: 'tour_completed',
        p_amount: bonuses.tour_completed.amount,
      });

      if (data) {
        setState(prev => ({
          ...prev,
          checklistItems: [...prev.checklistItems, 'tour_completed'],
          bonusEarned: prev.bonusEarned + bonuses.tour_completed.amount,
        }));
        toast.success(`+${(bonuses.tour_completed.amount / 100).toFixed(2)} créditos de bônus!`, {
          description: 'Parabéns por completar o tour!',
        });
      }
    }
  }, [user, getBonuses]);

  const claimBonus = useCallback(async (bonusType: string): Promise<boolean> => {
    if (!user) return false;

    const bonuses = getBonuses();
    const bonus = bonuses[bonusType as keyof typeof bonuses];
    if (!bonus || bonus.amount === 0) return false;

    const { data } = await supabase.rpc('credit_onboarding_bonus', {
      p_user_id: user.id,
      p_bonus_type: bonusType,
      p_amount: bonus.amount,
    });

    if (data) {
      setState(prev => ({
        ...prev,
        checklistItems: [...prev.checklistItems, bonusType],
        bonusEarned: prev.bonusEarned + bonus.amount,
      }));
      toast.success(`+${(bonus.amount / 100).toFixed(2)} créditos de bônus!`, {
        description: bonus.label,
      });
      return true;
    }

    return false;
  }, [user, getBonuses]);

  const hasClaimedBonus = useCallback((bonusType: string): boolean => {
    return state.checklistItems.includes(bonusType);
  }, [state.checklistItems]);

  const getChecklistProgress = useCallback(() => {
    const bonuses = getBonuses();
    const total = Object.keys(bonuses).length;
    const completed = state.checklistItems.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.checklistItems, getBonuses]);

  const dismissWelcomeModal = useCallback(() => {
    setState(prev => ({ ...prev, showWelcomeModal: false }));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        claimBonus,
        hasClaimedBonus,
        getTourSteps,
        getBonuses,
        getChecklistProgress,
        dismissWelcomeModal,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
