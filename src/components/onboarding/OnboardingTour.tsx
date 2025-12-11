import { useEffect, useState, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour() {
  const {
    showTour,
    tourCurrentStep,
    getTourSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useOnboarding();

  const [highlightPos, setHighlightPos] = useState<HighlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  
  const steps = getTourSteps();
  const currentStepData = steps[tourCurrentStep];
  const isLastStep = tourCurrentStep === steps.length - 1;
  const isFirstStep = tourCurrentStep === 0;

  const updatePositions = useCallback(() => {
    if (!currentStepData?.target) return;

    const element = document.querySelector(currentStepData.target);
    if (!element) {
      // Se o elemento não existe, tenta o próximo step
      if (!isLastStep) {
        nextStep();
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setHighlightPos({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calcular posição do tooltip
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (currentStepData.position) {
      case 'bottom':
        tooltipTop = rect.bottom + 16 + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        tooltipTop = rect.top - tooltipHeight - 16 + window.scrollY;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.left - tooltipWidth - 16;
        break;
      case 'right':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        tooltipLeft = rect.right + 16;
        break;
    }

    // Ajustar para não sair da tela
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, tooltipTop);

    setTooltipPos({ top: tooltipTop, left: tooltipLeft });
  }, [currentStepData, isLastStep, nextStep]);

  useEffect(() => {
    if (!showTour) return;

    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [showTour, tourCurrentStep, updatePositions]);

  // Scroll para o elemento em destaque
  useEffect(() => {
    if (!showTour || !currentStepData?.target) return;

    const element = document.querySelector(currentStepData.target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(updatePositions, 300);
    }
  }, [showTour, tourCurrentStep, currentStepData?.target, updatePositions]);

  if (!showTour || !currentStepData) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60" onClick={skipTour} />

      {/* Highlight do elemento */}
      {highlightPos && (
        <div
          className="absolute bg-transparent rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300 pointer-events-none"
          style={{
            top: highlightPos.top,
            left: highlightPos.left,
            width: highlightPos.width,
            height: highlightPos.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 bg-card border border-border rounded-lg shadow-2xl p-4 animate-fade-in"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={skipTour}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Conteúdo */}
        <div className="pr-6">
          <h3 className="font-semibold text-lg text-foreground mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          {/* Indicadores */}
          <div className="flex gap-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === tourCurrentStep
                    ? 'w-4 bg-primary'
                    : index < tourCurrentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-1">
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
