import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business config
const CPC_COST_COMPANY = 5; // Credits company pays
const CPC_PAYOUT_AFFILIATE_BASE = 3; // Base credits affiliate receives
const CPC_PLATFORM_FEE = 2; // Platform profit

// Anti-fraud config
const COOLDOWN_HOURS = 24; // Cooldown between clicks from same IP/offer
const GLOBAL_RATE_LIMIT_PER_HOUR = 50; // Max clicks per IP per hour (anti-bot)
const MIN_SESSION_AGE_MS = 1500; // Minimum time on page before click is valid (1.5 seconds)

// Extract real client IP
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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

    console.log(`Processing click - Offer: ${offerId}, IP: ${clientIp}, Type: ${clickType}, Session: ${sessionToken?.substring(0, 8) || 'none'}`);

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
        company_id,
        link_destination,
        active,
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

    // 1. Session validation (server-side time check)
    if (sessionToken) {
      const { data: session, error: sessionError } = await supabase
        .from("page_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .eq("offer_id", offerId)
        .maybeSingle();

      if (session && !session.validated) {
        const sessionAge = Date.now() - new Date(session.started_at).getTime();
        
        if (sessionAge < MIN_SESSION_AGE_MS) {
          console.log(`Session too young - Age: ${sessionAge}ms, Required: ${MIN_SESSION_AGE_MS}ms`);
          return new Response(
            JSON.stringify({ 
              error: "Clique muito rápido. Aguarde um momento.",
              blocked: true,
              reason: "session_too_young"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mark session as validated
        await supabase
          .from("page_sessions")
          .update({ validated: true })
          .eq("id", session.id);
      }
    }

    // 2. Advanced fingerprint check
    if (deviceId && advancedFingerprint) {
      // Check if this device is blocked
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

      // Check if same deviceId was used from different IP recently (suspicious)
      if (existingDevice && existingDevice.ip_address !== clientIp) {
        const timeSinceLastSeen = Date.now() - new Date(existingDevice.last_seen_at).getTime();
        const hoursAgo = timeSinceLastSeen / (1000 * 60 * 60);

        if (hoursAgo < 1) {
          console.log(`Suspicious: same deviceId from different IP within 1 hour`);
          // Mark as suspicious but don't block
          await supabase
            .from("device_fingerprints")
            .update({ is_suspicious: true })
            .eq("id", existingDevice.id);
        }
      }

      // Upsert device fingerprint
      await supabase
        .from("device_fingerprints")
        .upsert({
          device_id: deviceId,
          ip_address: clientIp,
          fingerprint_data: advancedFingerprint,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'device_id,ip_address' });
    }

    // 3. Global rate limit check (anti-bot): max 50 clicks per IP per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClickCount } = await supabase
      .from("offer_clicks")
      .select("*", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .gte("created_at", oneHourAgo);

    if (recentClickCount && recentClickCount >= GLOBAL_RATE_LIMIT_PER_HOUR) {
      console.log(`Rate limit exceeded for IP ${clientIp} - ${recentClickCount} clicks in last hour`);
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

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: offer.link_destination,
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

    // ========== PROCEED WITH VALID CLICK ==========

    // Check company balance
    if (companyProfile.balance < CPC_COST_COMPANY) {
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

    // 2. Debit company
    const { error: debitError } = await supabase
      .from("profiles")
      .update({ balance: companyProfile.balance - CPC_COST_COMPANY })
      .eq("id", companyProfile.id);

    if (debitError) {
      console.error("Error debiting company:", debitError);
      throw new Error("Erro ao processar pagamento");
    }

    // 3. Record company transaction
    await supabase.from("transactions").insert({
      user_id: companyProfile.id,
      amount: -CPC_COST_COMPANY,
      type: "CLICK_COST",
      description: `Clique na oferta`,
      offer_id: offerId,
    });

    // 4. Credit affiliate if valid (with level multiplier)
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
        actualAffiliatePayout = Math.floor(CPC_PAYOUT_AFFILIATE_BASE * multiplier);

        await supabase
          .from("profiles")
          .update({ balance: affiliateProfile.balance + actualAffiliatePayout })
          .eq("id", affiliateProfile.id);

        await supabase.from("transactions").insert({
          user_id: affiliateProfile.id,
          amount: actualAffiliatePayout,
          type: "CLICK_EARNING",
          description: `Comissão por clique (${multiplier}x)`,
          offer_id: offerId,
        });

        // Update affiliate stats
        await supabase.rpc("update_affiliate_stats", { 
          affiliate_profile_id: validAffiliateId, 
          earnings: actualAffiliatePayout 
        });
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

    console.log(`Main click processed - Offer: ${offerId}, Company: -${CPC_COST_COMPANY}, Affiliate: ${validAffiliateId ? `+${actualAffiliatePayout}` : 'none'}`);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: offer.link_destination,
        clickType: 'MAIN',
        charged: true,
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
