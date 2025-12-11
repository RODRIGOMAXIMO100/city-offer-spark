import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Anti-fraud config
const COOLDOWN_HOURS = 24;
const GLOBAL_RATE_LIMIT_PER_HOUR = 50;
const MIN_SESSION_AGE_MS = 1500;

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ========== TRACKING FUNCTIONS ==========

function generateTrackedWhatsAppLink(
  baseLink: string,
  offerTitle: string,
  offerId: string,
  affiliateId?: string | null
): string {
  // Extract number from wa.me link
  const waNumber = baseLink.replace('https://wa.me/', '').split('?')[0];
  
  // Build simple message - no refs, no emojis
  const message = `Olá!\nVi a oferta "${offerTitle}" no CliLin.`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encodedMessage}`;
}

function generateTrackedSiteLink(
  baseLink: string,
  offerTitle: string,
  offerId: string,
  city: string,
  affiliateId?: string | null
): string {
  try {
    const url = new URL(baseLink);
    
    // Standard UTM parameters
    url.searchParams.set('utm_source', 'clilin');
    url.searchParams.set('utm_medium', 'offer');
    
    // Campaign = sanitized offer title
    const campaign = offerTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 50);
    url.searchParams.set('utm_campaign', campaign);
    
    // Term = city
    const term = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    url.searchParams.set('utm_term', term);
    
    // Content = affiliate ID (if present)
    if (affiliateId) {
      url.searchParams.set('utm_content', `ref_${affiliateId.substring(0, 8)}`);
    }
    
    // Internal tracking ref
    url.searchParams.set('clilin_ref', offerId.substring(0, 8));
    
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return baseLink;
  }
}

function getTrackedRedirectUrl(
  linkDestination: string,
  linkType: string,
  offerTitle: string,
  offerId: string,
  city: string,
  affiliateId?: string | null
): string {
  if (linkType === 'WHATSAPP' || linkDestination.includes('wa.me')) {
    return generateTrackedWhatsAppLink(linkDestination, offerTitle, offerId, affiliateId);
  }
  return generateTrackedSiteLink(linkDestination, offerTitle, offerId, city, affiliateId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      offerId, 
      affiliateId, 
      fingerprint, 
      userAgent, 
      clickType = 'MAIN',
      sessionToken,
      deviceId,
      advancedFingerprint
    } = await req.json();

    const clientIp = getClientIp(req);

    console.log(`Processing click - Offer: ${offerId}, IP: ${clientIp}, Type: ${clickType}`);

    if (!offerId) {
      return new Response(
        JSON.stringify({ error: "Offer ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get offer details with company profile
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        id,
        title,
        link_type,
        company_id,
        link_destination,
        active,
        city,
        max_cpc_bid,
        current_offer_score,
        profiles!offers_company_id_fkey(id, balance, user_id, instagram_url)
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offerError);
      return new Response(
        JSON.stringify({ error: "Oferta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!offer.active) {
      return new Response(
        JSON.stringify({ error: "Oferta não está mais ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyProfile = offer.profiles as any;

    // If it's an Instagram click, it's FREE - just record and return
    if (clickType === 'INSTAGRAM') {
      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: affiliateId || null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'INSTAGRAM',
      });

      console.log(`Instagram click recorded for offer ${offerId} - FREE`);

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: companyProfile.instagram_url || offer.link_destination,
          clickType: 'INSTAGRAM',
          charged: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ANTI-FRAUD CHECKS FOR MAIN CLICKS ==========

    // 1. Session validation
    if (sessionToken) {
      const { data: session } = await supabase
        .from("page_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .eq("offer_id", offerId)
        .maybeSingle();

      if (session && !session.validated) {
        const sessionAge = Date.now() - new Date(session.started_at).getTime();
        
        if (sessionAge < MIN_SESSION_AGE_MS) {
          console.log(`Session too young - Age: ${sessionAge}ms`);
          return new Response(
            JSON.stringify({ 
              error: "Clique muito rápido. Aguarde um momento.",
              blocked: true,
              reason: "session_too_young"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("page_sessions")
          .update({ validated: true })
          .eq("id", session.id);
      }
    }

    // 2. Advanced fingerprint check
    if (deviceId && advancedFingerprint) {
      const { data: existingDevice } = await supabase
        .from("device_fingerprints")
        .select("*")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (existingDevice?.blocked) {
        console.log(`Blocked device detected - DeviceId: ${deviceId}`);
        return new Response(
          JSON.stringify({ 
            error: "Dispositivo bloqueado por atividade suspeita.",
            blocked: true,
            reason: "device_blocked"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingDevice && existingDevice.ip_address !== clientIp) {
        const timeSinceLastSeen = Date.now() - new Date(existingDevice.last_seen_at).getTime();
        const hoursAgo = timeSinceLastSeen / (1000 * 60 * 60);

        if (hoursAgo < 1) {
          console.log(`Suspicious: same deviceId from different IP within 1 hour`);
          await supabase
            .from("device_fingerprints")
            .update({ is_suspicious: true })
            .eq("id", existingDevice.id);
        }
      }

      await supabase
        .from("device_fingerprints")
        .upsert({
          device_id: deviceId,
          ip_address: clientIp,
          fingerprint_data: advancedFingerprint,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'device_id,ip_address' });
    }

    // 3. Global rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClickCount } = await supabase
      .from("offer_clicks")
      .select("*", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .gte("created_at", oneHourAgo);

    if (recentClickCount && recentClickCount >= GLOBAL_RATE_LIMIT_PER_HOUR) {
      console.log(`Rate limit exceeded for IP ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: "Muitos cliques detectados. Tente novamente mais tarde.",
          blocked: true,
          reason: "rate_limit"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Check 24h cooldown per IP/offer
    const cooldownTime = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
    const { data: existingRateLimit } = await supabase
      .from("click_rate_limits")
      .select("*")
      .eq("offer_id", offerId)
      .eq("ip_address", clientIp)
      .gte("last_click_at", cooldownTime)
      .maybeSingle();

    if (existingRateLimit) {
      console.log(`Duplicate click detected - IP: ${clientIp}, Offer: ${offerId}`);
      
      await supabase
        .from("click_rate_limits")
        .update({ 
          click_count: existingRateLimit.click_count + 1,
          last_click_at: new Date().toISOString()
        })
        .eq("id", existingRateLimit.id);

      await supabase.from("offer_clicks").insert({
        offer_id: offerId,
        affiliate_id: null,
        client_ip: clientIp,
        user_agent: userAgent,
        click_type: 'DUPLICATE',
      });

      // Duplicate clicks still get tracking for UX
      const duplicateRedirectUrl = getTrackedRedirectUrl(
        offer.link_destination,
        offer.link_type,
        offer.title,
        offerId,
        offer.city,
        null // No affiliate credit for duplicates
      );

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: duplicateRedirectUrl,
          clickType: 'DUPLICATE',
          charged: false,
          reason: "already_clicked_today"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check for affiliate self-click fraud
    let validAffiliateId = affiliateId;
    if (affiliateId) {
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("id", affiliateId)
        .maybeSingle();

      if (affiliateProfile) {
        const { data: affiliateClicks } = await supabase
          .from("offer_clicks")
          .select("client_ip")
          .eq("affiliate_id", affiliateId)
          .limit(20);

        const affiliateIps = new Set(affiliateClicks?.map(c => c.client_ip));
        
        if (affiliateIps.has(clientIp)) {
          console.log(`Self-click detected - Affiliate: ${affiliateId}, IP: ${clientIp}`);
          validAffiliateId = null;
        }
      }
    }

    // ========== CALCULATE DYNAMIC CPC (Google Ads Style) ==========
    
    // Get dynamic CPC using database function
    const { data: realCpc } = await supabase
      .rpc("calculate_real_cpc", { p_offer_id: offerId, p_city: offer.city });
    
    const cpcCost = realCpc || 5; // Fallback to 5 if function fails
    
    console.log(`Dynamic CPC calculated - Offer: ${offerId}, CPC: ${cpcCost}, Bid: ${offer.max_cpc_bid}, Score: ${offer.current_offer_score}`);

    // Get pricing config for affiliate share
    const { data: pricingConfig } = await supabase
      .from("pricing_config")
      .select("*")
      .limit(1)
      .single();
    
    const affiliateShare = pricingConfig?.affiliate_share || 0.60;

    // Check company balance
    if (companyProfile.balance < cpcCost) {
      await supabase
        .from("offers")
        .update({ active: false })
        .eq("id", offerId);

      return new Response(
        JSON.stringify({ error: "Empresa sem créditos suficientes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Record rate limit entry
    await supabase.from("click_rate_limits").upsert({
      offer_id: offerId,
      ip_address: clientIp,
      fingerprint: fingerprint || null,
      click_count: 1,
      first_click_at: new Date().toISOString(),
      last_click_at: new Date().toISOString(),
    }, { onConflict: 'offer_id,ip_address' });

    // 2. Debit company with DYNAMIC CPC
    const { error: debitError } = await supabase
      .from("profiles")
      .update({ balance: companyProfile.balance - cpcCost })
      .eq("id", companyProfile.id);

    if (debitError) {
      console.error("Error debiting company:", debitError);
      throw new Error("Erro ao processar pagamento");
    }

    // 3. Record company transaction with actual CPC
    await supabase.from("transactions").insert({
      user_id: companyProfile.id,
      amount: -cpcCost,
      type: "CLICK_COST",
      description: `Clique na oferta (CPC: ${cpcCost})`,
      offer_id: offerId,
    });

    // 4. Credit affiliate if valid (with level multiplier and dynamic earnings)
    let actualAffiliatePayout = 0;
    if (validAffiliateId) {
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, balance")
        .eq("id", validAffiliateId)
        .single();

      if (affiliateProfile) {
        // Get commission multiplier from affiliate level
        const { data: multiplierResult } = await supabase
          .rpc("get_commission_multiplier", { affiliate_profile_id: validAffiliateId });

        const multiplier = multiplierResult || 1.0;
        
        // Calculate affiliate payout: CPC × affiliate_share × level_multiplier
        const basePayout = Math.floor(cpcCost * affiliateShare);
        actualAffiliatePayout = Math.floor(basePayout * multiplier);

        await supabase
          .from("profiles")
          .update({ balance: affiliateProfile.balance + actualAffiliatePayout })
          .eq("id", affiliateProfile.id);

        await supabase.from("transactions").insert({
          user_id: affiliateProfile.id,
          amount: actualAffiliatePayout,
          type: "CLICK_EARNING",
          description: `Comissão por clique (CPC: ${cpcCost}, ${multiplier}x)`,
          offer_id: offerId,
        });

        // Update affiliate stats
        await supabase.rpc("update_affiliate_stats", { 
          affiliate_profile_id: validAffiliateId, 
          earnings: actualAffiliatePayout 
        });

        // Check if affiliate entered Top 10 weekly
        const { data: topAffiliates } = await supabase
          .from("affiliate_stats")
          .select("affiliate_id, clicks_this_week")
          .order("clicks_this_week", { ascending: false })
          .limit(10);

        if (topAffiliates) {
          const position = topAffiliates.findIndex(a => a.affiliate_id === validAffiliateId) + 1;
          
          if (position > 0 && position <= 10) {
            const { data: existingNotif } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", validAffiliateId)
              .eq("type", "TOP_10")
              .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle();

            if (!existingNotif) {
              await supabase.from("notifications").insert({
                user_id: validAffiliateId,
                type: "TOP_10",
                title: "Parabéns! Você entrou no Top 10! 🏆",
                message: `Você está na posição #${position} do ranking semanal!`,
                data: { position },
              });
            }
          }
        }
      }
    }

    // 5. Record click
    await supabase.from("offer_clicks").insert({
      offer_id: offerId,
      affiliate_id: validAffiliateId || null,
      client_ip: clientIp,
      user_agent: userAgent,
      click_type: 'MAIN',
    });

    // 6. Increment click count
    await supabase.rpc("increment_offer_clicks", { offer_id: offerId });

    // Generate tracked redirect URL
    const trackedRedirectUrl = getTrackedRedirectUrl(
      offer.link_destination,
      offer.link_type,
      offer.title,
      offerId,
      offer.city,
      validAffiliateId
    );

    console.log(`Main click processed - Offer: ${offerId}, CPC: ${cpcCost}, Company: -${cpcCost}, Affiliate: ${validAffiliateId ? `+${actualAffiliatePayout}` : 'none'}`);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: trackedRedirectUrl,
        clickType: 'MAIN',
        charged: true,
        cpc: cpcCost,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-click:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});