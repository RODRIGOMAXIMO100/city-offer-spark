import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fonte única da regra de cobrança.
 *
 * Antes disso, a taxa por resgate estava chumbada em dois lugares do frontend
 * (`Math.max(300, price_new * 100 * 0.15)`) enquanto o banco lia de
 * `pricing_config`. Se a taxa mudasse no banco, a tela mostrava um valor e a
 * empresa era cobrada outro. Agora tudo lê daqui.
 *
 * ATENÇÃO À UNIDADE: `offers.price_new` é numeric em REAIS (50.00 = R$50),
 * mas balance/amount/fee_cents/total_cents são inteiros em CENTAVOS.
 * As funções abaixo recebem reais e devolvem centavos.
 */

export interface PricingConfig {
  /** fração, ex.: 0.15 = 15% do preço promocional */
  fee_percent: number;
  /** piso da taxa, em centavos */
  fee_min_cents: number;
  /** desconto do pré-pago, ex.: 0.10 = 10% */
  prepaid_discount: number;
  /** fatia base do divulgador sobre a taxa cheia, ex.: 0.50 */
  redemption_affiliate_share: number;
}

/** Espelha o que está em produção hoje. Só entra em cena se a leitura falhar. */
export const PRICING_FALLBACK: PricingConfig = {
  fee_percent: 0.15,
  fee_min_cents: 300,
  prepaid_discount: 0.10,
  redemption_affiliate_share: 0.50,
};

/** A config muda muito raramente e várias telas leem: cache em memória. */
let cacheConfig: PricingConfig | null = null;

/**
 * Taxa cheia do resgate, em CENTAVOS.
 * @param priceNewReais preço promocional em reais (offers.price_new)
 */
export function calcRedemptionFeeCents(
  priceNewReais: number,
  cfg: PricingConfig,
): number {
  const bruto = Math.round((Number(priceNewReais) || 0) * 100 * cfg.fee_percent);
  return Math.max(cfg.fee_min_cents, bruto);
}

/**
 * O que a empresa efetivamente paga, em CENTAVOS.
 * Pré-pago ganha desconto; pós-pago paga cheio.
 */
export function calcChargedFeeCents(
  feeCents: number,
  billingMode: string | null | undefined,
  cfg: PricingConfig,
): number {
  if ((billingMode ?? 'PRE').toUpperCase() !== 'PRE') return feeCents;
  return Math.round(feeCents * (1 - cfg.prepaid_discount));
}

/**
 * Comissão do divulgador, em CENTAVOS.
 * Incide sempre sobre a taxa CHEIA — o desconto do pré-pago sai da margem da
 * Clilin, nunca do divulgador.
 * @param multiplicador multiplicador do nível (Bronze 1.0 … Diamante 1.4)
 */
export function calcAffiliateEarningCents(
  feeCents: number,
  multiplicador: number,
  cfg: PricingConfig,
): number {
  return Math.round(feeCents * cfg.redemption_affiliate_share * (multiplicador || 1));
}

export function usePricingConfig() {
  const [config, setConfig] = useState<PricingConfig>(cacheConfig ?? PRICING_FALLBACK);
  const [loading, setLoading] = useState(!cacheConfig);

  useEffect(() => {
    if (cacheConfig) return;
    let vivo = true;

    (async () => {
      try {
        // O types.ts gerado pode estar atrasado em relação ao banco (campos da
        // Fase 1). O cast evita quebrar o build por isso — a validação do
        // formato é feita logo abaixo, campo a campo.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('pricing_config')
          .select('fee_percent, fee_min_cents, prepaid_discount, redemption_affiliate_share')
          .limit(1)
          .maybeSingle();

        if (!vivo) return;

        if (!error && data) {
          const lido: PricingConfig = {
            fee_percent: Number(data.fee_percent ?? PRICING_FALLBACK.fee_percent),
            fee_min_cents: Number(data.fee_min_cents ?? PRICING_FALLBACK.fee_min_cents),
            prepaid_discount: Number(data.prepaid_discount ?? PRICING_FALLBACK.prepaid_discount),
            redemption_affiliate_share: Number(
              data.redemption_affiliate_share ?? PRICING_FALLBACK.redemption_affiliate_share,
            ),
          };
          // valor inválido (NaN/negativo) não pode virar cobrança errada na tela
          const valido =
            lido.fee_percent > 0 &&
            lido.fee_min_cents >= 0 &&
            lido.redemption_affiliate_share > 0;
          if (valido) {
            cacheConfig = lido;
            setConfig(lido);
          }
        }
      } catch (e) {
        console.error('pricing_config: usando fallback.', e);
      } finally {
        if (vivo) setLoading(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  return { config, loading };
}
