-- Recalibracao da curva de niveis: teto 90% (plataforma sempre fica com >=10%).
-- Antes: multiplicadores ate 1.60 faziam a fatia do divulgador estourar 100%
--        (Diamante = 0.70 x 1.60 = 112%), ou seja a plataforma pagava do proprio bolso.
-- Agora: fatia do divulgador vai de 70% (Bronze) a ~90% (Diamante); plataforma sempre lucra.
-- share base = 0.70 | fatia = 0.70 x commission_multiplier
UPDATE public.affiliate_levels SET commission_multiplier=1.00, benefits=ARRAY['Comissao de 70%','Comece a indicar']       WHERE id=1; -- Bronze  70%
UPDATE public.affiliate_levels SET commission_multiplier=1.07, benefits=ARRAY['Comissao de 75%','Destaque no ranking']    WHERE id=2; -- Prata   ~75%
UPDATE public.affiliate_levels SET commission_multiplier=1.14, benefits=ARRAY['Comissao de 80%','Suporte prioritario']    WHERE id=3; -- Ouro    ~80%
UPDATE public.affiliate_levels SET commission_multiplier=1.21, benefits=ARRAY['Comissao de 85%','Ofertas exclusivas']     WHERE id=4; -- Platina ~85%
UPDATE public.affiliate_levels SET commission_multiplier=1.28, benefits=ARRAY['Comissao de 90%','Bonus mensais']          WHERE id=5; -- Diamante ~90%
