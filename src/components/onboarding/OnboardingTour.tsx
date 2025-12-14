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
  const [tooltipPos, setTooltipPos] = useState({ top: 200, left: 100 });
  
  const steps = getTourSteps();
  const currentStepData = steps[tourCurrentStep];
  const isLastStep = tourCurrentStep === steps.length - 1;
  const isFirstStep = tourCurrentStep === 0;

  const updatePositions = useCallback(() => {
    if (!currentStepData?.target) {
      setHighlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 80,
        left: window.innerWidth / 2 - 160,
      });
      return;
    }

    const element = document.querySelector(currentStepData.target);
    if (!element) {
      setHighlightPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 80,
        left: window.innerWidth / 2 - 160,
      });
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setHighlightPos({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const tooltipHeight = 140;
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (currentStepData.position) {
      case 'bottom':
        tooltipTop = rect.bottom + 16;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        tooltipTop = rect.top - tooltipHeight - 16;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.left - tooltipWidth - 16;
        break;
      case 'right':
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.right + 16;
        break;
    }

    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));

    setTooltipPos({ top: tooltipTop, left: tooltipLeft });
  }, [currentStepData]);

  useEffect(() => {
    if (!showTour || !currentStepData?.target) return;

    let retryCount = 0;
    const maxRetries = 8;
    let retryTimer: NodeJS.Timeout;
    let cancelled = false;

    const findElement = () => {
      if (cancelled) return;
      
      const element = document.querySelector(currentStepData.target);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(updatePositions, 100);
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Tour: tentativa ${retryCount}/${maxRetries} para ${currentStepData.target}`);
        retryTimer = setTimeout(findElement, 350);
      } else {
        // Após todas tentativas, pular para próximo step
        console.warn(`Tour: elemento ${currentStepData.target} não encontrado após ${maxRetries} tentativas, pulando`);
        if (!isLastStep) {
          nextStep();
        } else {
          completeTour();
        }
      }
    };

    // Delay inicial maior para garantir renderização
    const initialTimer = setTimeout(findElement, 400);

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearTimeout(retryTimer);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [showTour, tourCurrentStep, currentStepData?.target, updatePositions, isLastStep, nextStep, completeTour]);

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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={skipTour} />

      {/* Highlight */}
      {highlightPos && (
        <div
          className="absolute bg-transparent rounded-lg ring-4 ring-primary pointer-events-none transition-all duration-200"
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
        className="absolute w-[calc(100vw-32px)] sm:w-80 max-w-[320px] bg-card border border-border rounded-lg shadow-2xl p-4 transition-all duration-200"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <button
          onClick={skipTour}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="pr-6">
          <h3 className="font-semibold text-base text-foreground mb-1">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <div className="flex gap-1">
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

          <div className="flex gap-1.5">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 px-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-1 h-8 px-3">
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
