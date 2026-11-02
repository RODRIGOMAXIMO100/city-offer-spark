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
  // Bônus de boas-vindas (pequenos, em centavos)
  AFFILIATE: {
    tour_completed: { amount: 100, label: 'Completar o tour' }, // R$1,00
  },
  COMPANY: {
    tour_completed: { amount: 100, label: 'Completar o tour' }, // R$1,00
    logo_added: { amount: 100, label: 'Adicionar logo' }, // R$1,00
    instagram_connected: { amount: 100, label: 'Conectar Instagram' }, // R$1,00
  },
  CLIENT: {}, // Cliente não tem bônus
};

// Steps do tour por tipo de usuário
export const TOUR_STEPS: Record<string, TourStep[]> = {
  AFFILIATE: [
    {
      target: '[data-tour="balance"]',
      title: 'Seu saldo e saque',
      content: 'Aqui entram as suas comissões. Você ganha quando o cliente que você indicou usa o cupom na loja. O saque é via Pix a partir de R$ 100.',
      position: 'bottom',
    },
    {
      target: '[data-tour="level"]',
      title: 'Seu nível',
      content: 'Quanto mais clientes você leva até as lojas, mais alto o seu nível e maior a sua comissão.',
      position: 'bottom',
    },
    {
      target: '[data-tour="offers"]',
      title: 'Ofertas da sua cidade',
      content: 'Escolha uma oferta, copie o seu link e divulgue. Cada cupom pego pelo seu link fica marcado no seu nome.',
      position: 'top',
    },
  ],
  COMPANY: [
    {
      target: '[data-tour="balance"]',
      title: 'Seu saldo',
      content: 'O saldo só é usado quando um cliente usa o cupom na sua loja: 15% do preço da oferta, mínimo de R$ 3. Adicione no "+".',
      position: 'bottom',
    },
    {
      target: '[data-tour="create-offer"]',
      title: 'Crie sua oferta',
      content: 'Monte a promoção, com preço, validade e fotos. Ela aparece para os clientes da sua cidade e para os divulgadores.',
      position: 'top',
    },
    {
      target: '[data-tour="performance"]',
      title: 'Seus resultados',
      content: 'Acompanhe quantas pessoas viram a oferta e pegaram o cupom. Quando o cliente toca em \"Estou na loja\" ou \"Pedir online\", ele aparece na aba \"Confirmar cupons\" e no seu WhatsApp com o botão Confirmar uso. Um toque e pronto.',
      position: 'bottom',
    },
  ],
  CLIENT: [
    {
      target: '[data-tour="chat-input"]',
      title: 'Busque Ofertas',
      content: 'Digite o que você procura: "pizza", "academia", "salão de beleza"... Nossa IA encontra as melhores ofertas para você!',
      position: 'top',
    },
    {
      target: '[data-tour="location"]',
      title: 'Sua Cidade',
      content: 'As ofertas são filtradas pela sua localização para mostrar apenas o que está perto de você.',
      position: 'bottom',
    },
    {
      target: '[data-tour="chat-area"]',
      title: 'Resultados Personalizados',
      content: 'Aqui aparecem as ofertas encontradas. Clique em "Ver Oferta" para mais detalhes ou acesse direto o Instagram da empresa.',
      position: 'bottom',
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
  dismissed: boolean;
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
  dismissOnboarding: () => Promise<void>;
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
    dismissed: false,
  });

  // Carregar estado do onboarding
  useEffect(() => {
    // Não carregar onboarding se não há usuário, role ainda não carregou, ou é ADMIN
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Aguardar o role carregar
    if (role === null) {
      return;
    }

    // ADMIN não precisa de onboarding
    if (role === 'ADMIN') {
      setState(prev => ({ ...prev, isLoading: false, showWelcomeModal: false }));
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
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (data) {
          const checklistItems = Array.isArray(data.checklist_items) 
            ? data.checklist_items as string[]
            : [];
          
          // Verificar se está dismissed OU se é objeto com propriedade dismissed
          const isDismissed = (data as { dismissed?: boolean }).dismissed === true;
          
          setState({
            isLoading: false,
            tourCompleted: data.tour_completed || false,
            tourCurrentStep: data.tour_current_step || 0,
            checklistItems,
            bonusEarned: data.bonus_earned || 0,
            showTour: false,
            showWelcomeModal: !data.tour_completed && !isDismissed,
            dismissed: isDismissed,
          });
        } else {
          // Criar registro de onboarding apenas para roles válidos
          const validRoles = ['COMPANY', 'AFFILIATE', 'CLIENT'];
          if (validRoles.includes(role)) {
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
              dismissed: false,
            });
          } else {
            setState(prev => ({ ...prev, isLoading: false, showWelcomeModal: false }));
          }
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
      const { data } = await supabase.functions.invoke('credit-onboarding-bonus', {
        body: { bonus_type: 'tour_completed' },
      });



      if (data?.credited) {

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

    const { data } = await supabase.functions.invoke('credit-onboarding-bonus', {
      body: { bonus_type: bonusType },
    });

    if (data?.credited) {

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

  const dismissOnboarding = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, dismissed: true }));

    await supabase
      .from('user_onboarding')
      .update({ dismissed: true } as any)
      .eq('user_id', user.id);
  }, [user]);

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
        dismissOnboarding,
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
