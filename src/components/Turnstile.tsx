import { useEffect, useRef, useCallback, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

const TURNSTILE_SITE_KEY = '0x4AAAAAACGaRAy6os1CNP3H';

const Turnstile = forwardRef<HTMLDivElement, TurnstileProps>(
  ({ onVerify, onExpire, onError, className }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const setRefs = useCallback(
      (element: HTMLDivElement | null) => {
        containerRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile) return;
      
      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget might already be removed
        }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme: 'auto',
        size: 'normal',
      });
    }, [onVerify, onExpire, onError]);

    useEffect(() => {
      // Check if script is already loaded
      if (window.turnstile) {
        renderWidget();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript && !scriptLoadedRef.current) {
        window.onTurnstileLoad = renderWidget;
        return;
      }

      // Load the Turnstile script
      if (!scriptLoadedRef.current) {
        scriptLoadedRef.current = true;
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
        script.async = true;
        script.defer = true;
        
        window.onTurnstileLoad = renderWidget;
        
        document.head.appendChild(script);
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Widget might already be removed
          }
        }
      };
    }, [renderWidget]);

    return <div ref={setRefs} className={className} />;
  }
);

Turnstile.displayName = 'Turnstile';

export default Turnstile;
