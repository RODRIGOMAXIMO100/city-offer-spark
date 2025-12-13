import { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Gift, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { formatCentsToBRL } from '@/types/database';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function OnboardingChecklist() {
  const {
    tourCompleted,
    isLoading,
    getBonuses,
    hasClaimedBonus,
    getChecklistProgress,
    bonusEarned,
    startTour,
    dismissed,
    dismissOnboarding,
  } = useOnboarding();

  const isMobile = useIsMobile();
  // Começa colapsado no mobile
  const [isExpanded, setIsExpanded] = useState(false);

  // Atualiza estado quando detecta se é mobile
  useEffect(() => {
    setIsExpanded(!isMobile);
  }, [isMobile]);

  const bonuses = getBonuses();
  const progress = getChecklistProgress();
  const bonusItems = Object.entries(bonuses);
  const allCompleted = progress.completed === progress.total;

  // Não mostrar se foi dismissed no banco OU se está carregando
  if (isLoading || dismissed) return null;

  // Não mostrar se todas as tarefas foram completadas
  if (allCompleted) return null;

  // Mobile: Versão mini quando colapsado (FAB discreto)
  if (isMobile && !isExpanded) {
    return (
      <div className="fixed bottom-20 right-4 z-50 animate-fade-in">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-card border border-border rounded-full p-3 shadow-lg flex items-center gap-2 hover:bg-muted transition-colors"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{progress.completed}/{progress.total}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 animate-fade-in",
      isMobile ? "bottom-20 right-4 left-4" : "bottom-4 right-4 w-80"
    )}>
      <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-3 cursor-pointer transition-colors',
            allCompleted
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
              : 'bg-gradient-to-r from-primary/10 to-affiliate/10'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {allCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {allCompleted ? 'Onboarding Completo! 🎉' : 'Primeiros Passos'}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress.completed}/{progress.total} tarefas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!allCompleted && bonusEarned > 0 && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                +{formatCentsToBRL(bonusEarned)}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress.percentage} className="h-1 rounded-none" />

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
            {/* Tour button se não completou */}
            {!tourCompleted && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10"
                onClick={startTour}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Fazer o tour interativo</span>
              </Button>
            )}

            {/* Lista de tarefas */}
            <div className="space-y-1">
              {bonusItems.map(([key, bonus]) => {
                const isCompleted = hasClaimedBonus(key);
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md transition-colors',
                      isCompleted ? 'bg-muted/50' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          isCompleted && 'text-muted-foreground line-through'
                        )}
                      >
                        {bonus.label}
                      </span>
                    </div>
                    {bonus.amount > 0 && (
                      <div className="flex items-center gap-1">
                        <Gift className="h-3 w-3 text-primary" />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isCompleted ? 'text-muted-foreground' : 'text-primary'
                          )}
                        >
                          +{formatCentsToBRL(bonus.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resumo de bônus */}
            {bonusEarned > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total ganho:</span>
                  <span className="font-semibold text-primary">
                    {formatCentsToBRL(bonusEarned)}
                  </span>
                </div>
              </div>
            )}

            {/* Botão de fechar - persiste no banco */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground"
              onClick={dismissOnboarding}
            >
              <X className="h-4 w-4 mr-1" />
              Não mostrar mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
