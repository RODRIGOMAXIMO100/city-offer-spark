import { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Gift, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { formatCentsToBRL } from '@/types/database';
import { cn } from '@/lib/utils';

export function OnboardingChecklist() {
  const {
    tourCompleted,
    isLoading,
    getBonuses,
    hasClaimedBonus,
    getChecklistProgress,
    bonusEarned,
    startTour,
  } = useOnboarding();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || isDismissed) return null;

  const bonuses = getBonuses();
  const progress = getChecklistProgress();
  const bonusItems = Object.entries(bonuses);
  const allCompleted = progress.completed === progress.total;

  // Não mostrar se tudo foi completado e o usuário não quer ver
  if (allCompleted && !isExpanded) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-fade-in">
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
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
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

            {/* Botão de fechar se completou tudo */}
            {allCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => setIsDismissed(true)}
              >
                <X className="h-4 w-4 mr-1" />
                Fechar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
