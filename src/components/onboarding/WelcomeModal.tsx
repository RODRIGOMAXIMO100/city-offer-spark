import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { Rocket, Gift, Star, ArrowRight, X } from 'lucide-react';
import { formatCentsToBRL } from '@/types/database';

export function WelcomeModal() {
  const { showWelcomeModal, startTour, dismissWelcomeModal, getBonuses } = useOnboarding();
  const { role, profile } = useAuth();

  if (!showWelcomeModal) return null;

  const bonuses = getBonuses();
  const totalBonus = Object.values(bonuses).reduce((acc, b) => acc + b.amount, 0);

  const getRoleTitle = () => {
    switch (role) {
      case 'AFFILIATE':
        return 'Divulgador';
      case 'COMPANY':
        return 'Empresa';
      case 'CLIENT':
        return 'Cliente';
      default:
        return 'Usuário';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'AFFILIATE':
        return 'Compartilhe ofertas e ganhe comissão por cada lead válido!';
      case 'COMPANY':
        return 'Divulgue suas ofertas e atraia novos clientes para seu negócio!';
      case 'CLIENT':
        return 'Descubra as melhores ofertas da sua cidade com nossa IA!';
      default:
        return 'Bem-vindo à plataforma!';
    }
  };

  return (
    <Dialog open={showWelcomeModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-affiliate flex items-center justify-center">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl">
            Bem-vindo, {profile?.name?.split(' ')[0] || getRoleTitle()}! 🎉
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {getRoleDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {totalBonus > 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-affiliate/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Bônus de Boas-Vindas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete as tarefas e ganhe até{' '}
                    <span className="font-bold text-primary">{formatCentsToBRL(totalBonus)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Tour Interativo</p>
                <p className="text-xs text-muted-foreground">
                  Vamos te mostrar como usar todas as funcionalidades
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Checklist de Tarefas</p>
                <p className="text-xs text-muted-foreground">
                  Complete as tarefas iniciais e ganhe bônus
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={startTour} className="w-full gap-2">
            Começar Tour
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissWelcomeModal}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Pular por agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
