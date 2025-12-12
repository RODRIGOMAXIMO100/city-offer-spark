import { useEffect, useState, useCallback, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
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
  const [tooltipPos, setTooltipPos] = useState(() => ({
    top: typeof window !== 'undefined' ? window.innerHeight / 2 - 90 : 300,
    left: typeof window !== 'undefined' ? window.innerWidth / 2 - 160 : 300,
  }));
  const [isReady, setIsReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [elementNotFound, setElementNotFound] = useState(false);
  const retryCountRef = useRef(0);
  const isScrollingRef = useRef(false);
  const prevStepRef = useRef(tourCurrentStep);
  const maxRetries = 5;
  
  const steps = getTourSteps();
  const currentStepData = steps[tourCurrentStep];
  const isLastStep = tourCurrentStep === steps.length - 1;
  const isFirstStep = tourCurrentStep === 0;

  const updatePositions = useCallback(() => {
    // Bloquear updates durante scroll automático
    if (isScrollingRef.current) return;
    
    if (!currentStepData?.target) return;

    const element = document.querySelector(currentStepData.target);
    if (!element) {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(updatePositions, 300);
        return;
      }
      setHighlightPos(null);
      setElementNotFound(true);
      setTooltipPos({
        top: window.innerHeight / 2 - 90,
        left: window.innerWidth / 2 - 160,
      });
      return;
    }

    retryCountRef.current = 0;
    setElementNotFound(false);

    const rect = element.getBoundingClientRect();
    const padding = 8;

    // IMPORTANTE: Usar apenas rect (já é relativo ao viewport) pois container é fixed
    setHighlightPos({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const tooltipWidth = Math.min(340, window.innerWidth - 32);
    const tooltipHeight = 160; // Reduced for better fit
    let tooltipTop = 0;
    let tooltipLeft = 0;

    // IMPORTANTE: Sem window.scrollY pois container é fixed
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

    // Garantir que tooltip fica dentro da viewport
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));

    setTooltipPos({ top: tooltipTop, left: tooltipLeft });
  }, [currentStepData]);

  // Reset estados e faz scroll ANTES de calcular posições
  useEffect(() => {
    if (!showTour) {
      setIsReady(false);
      setIsTransitioning(false);
      isScrollingRef.current = false;
      return;
    }

    // Detectar se é transição entre steps
    const isStepChange = prevStepRef.current !== tourCurrentStep;
    prevStepRef.current = tourCurrentStep;

    // Iniciar transição suave
    if (isStepChange && isReady) {
      setIsTransitioning(true);
    }

    // Reset para novo step
    retryCountRef.current = 0;
    setElementNotFound(false);
    setIsReady(false);
    isScrollingRef.current = true;

    // Função para processar o step
    const processStep = async () => {
      // Aguardar fade out da transição
      if (isStepChange) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Aguardar elementos renderizarem - tempo aumentado para garantir
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar elemento com retry
      let element: Element | null = null;
      let retries = 0;
      const maxSearchRetries = 10;
      
      console.log(`[Tour] Step ${tourCurrentStep}: buscando ${currentStepData?.target}`);
      
      while (!element && retries < maxSearchRetries && currentStepData?.target) {
        element = document.querySelector(currentStepData.target);
        if (!element) {
          retries++;
          console.log(`[Tour] Tentativa ${retries}/${maxSearchRetries} para encontrar ${currentStepData.target}`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`[Tour] Elemento encontrado: ${!!element} após ${retries} tentativas`);

      if (element) {
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        
        // Função para verificar se elemento está bem centralizado
        const isWellPositioned = () => {
          const r = element!.getBoundingClientRect();
          const elementCenter = r.top + r.height / 2;
          const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
          return distanceFromCenter < viewportHeight * 0.3 && r.top > 80 && r.bottom < viewportHeight - 80;
        };
        
        // Primeira verificação de posição
        let rect = element.getBoundingClientRect();
        const initialDistance = Math.abs(rect.top - viewportCenter);
        
        console.log(`[Tour] Posição inicial: top=${rect.top}, bem posicionado=${isWellPositioned()}`);
        
        // Sempre fazer scroll se não estiver bem posicionado
        if (!isWellPositioned()) {
          console.log(`[Tour] Fazendo scroll para elemento...`);
          
          // Usar scrollTo com offset calculado para centralizar melhor
          const elementRect = element.getBoundingClientRect();
          const elementCenterY = elementRect.top + window.scrollY + elementRect.height / 2;
          const targetScrollY = elementCenterY - viewportCenter;
          
          window.scrollTo({
            top: Math.max(0, targetScrollY),
            behavior: 'smooth'
          });
          
          // Tempo de espera fixo mais longo para garantir scroll completo
          await new Promise(resolve => setTimeout(resolve, 700));
          
          // Verificação pós-scroll - tentar novamente se necessário
          if (!isWellPositioned()) {
            console.log(`[Tour] Segunda tentativa de scroll...`);
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        console.warn(`[Tour] Elemento não encontrado após ${maxSearchRetries} tentativas: ${currentStepData?.target}`);
        setElementNotFound(true);
      }

      // Liberar flag de scroll
      isScrollingRef.current = false;
      
      // Agora calcular posições
      updatePositions();
      
      // Finalizar transição e marcar como pronto
      setIsTransitioning(false);
      setIsReady(true);
    };

    processStep();

    // Handler que ignora updates durante scroll automático
    const handleScrollResize = () => {
      if (!isScrollingRef.current) {
        updatePositions();
      }
    };

    window.addEventListener('resize', handleScrollResize);
    window.addEventListener('scroll', handleScrollResize);

    return () => {
      window.removeEventListener('resize', handleScrollResize);
      window.removeEventListener('scroll', handleScrollResize);
      isScrollingRef.current = false;
    };
  }, [showTour, tourCurrentStep, currentStepData?.target, updatePositions]);

  if (!showTour || !currentStepData) return null;

  // Mostrar loading enquanto prepara o tour - com pointer-events-none para bloquear interação
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 pointer-events-auto">
        <div className="bg-card p-6 rounded-lg shadow-2xl text-center border border-border pointer-events-none">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-foreground font-medium">Preparando tour...</p>
          <p className="text-xs text-muted-foreground mt-1">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay escuro com transição */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-300" 
        onClick={skipTour} 
      />

      {/* Highlight do elemento com animação suave */}
      {highlightPos && (
        <div
          className={cn(
            "absolute bg-transparent rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none",
            "transition-all duration-500 ease-out",
            isTransitioning && "opacity-0 scale-95"
          )}
          style={{
            top: highlightPos.top,
            left: highlightPos.left,
            width: highlightPos.width,
            height: highlightPos.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip com animação de transição */}
      <div
        className={cn(
          "absolute w-[calc(100vw-32px)] sm:w-80 max-w-[340px] bg-card border border-border rounded-lg shadow-2xl p-3 sm:p-4",
          "transition-all duration-300 ease-out",
          isTransitioning 
            ? "opacity-0 translate-y-2 scale-95" 
            : "opacity-100 translate-y-0 scale-100"
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={skipTour}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Conteúdo */}
        <div className="pr-8">
          <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1.5">
            {currentStepData.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          {/* Indicadores */}
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === tourCurrentStep
                    ? 'w-3 sm:w-4 bg-primary'
                    : index < tourCurrentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-1.5">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 px-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-1 h-8 px-3 text-xs sm:text-sm">
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
