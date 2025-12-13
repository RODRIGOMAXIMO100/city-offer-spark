import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Anti-fraud config
const COOLDOWN_DAYS = 30; // Same phone can't register for same offer within 30 days
const MIN_SESSION_AGE_MS = 1500;

// Brazil timezone ranges (UTC-2 to UTC-5)
const BRAZIL_TIMEZONE_MIN = -5 * 60;
const BRAZIL_TIMEZONE_MAX = -2 * 60;

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isTimezoneConsistentWithBrazil(timezoneOffset: number | null | undefined): boolean {
  if (timezoneOffset === null || timezoneOffset === undefined) return true;
  return timezoneOffset >= BRAZIL_TIMEZONE_MIN && timezoneOffset <= BRAZIL_TIMEZONE_MAX;
}

// Validate Brazilian phone number
function validateBrazilianPhone(phone: string): { valid: boolean; cleaned: string } {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian mobile: 11 digits (DDD + 9 + 8 digits) or 10 digits (old format)
  // Format: (XX) 9XXXX-XXXX or (XX) XXXX-XXXX
  if (cleaned.length < 10 || cleaned.length > 11) {
    return { valid: false, cleaned };
  }
  
  // Check DDD (must be between 11-99)
  const ddd = parseInt(cleaned.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valid: false, cleaned };
  }
  
  // If 11 digits, must start with 9 after DDD (mobile)
  if (cleaned.length === 11 && cleaned[2] !== '9') {
    return { valid: false, cleaned };
  }
  
  return { valid: true, cleaned };
}

// Validate name (at least 2 words)
function validateName(name: string): boolean {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  return words.length >= 2 && trimmed.length >= 5;
}

// Simple hash for phone deduplication
function hashPhone(phone: string): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    const char = phone.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ========== SUSPICIOUS ASN LIST ==========
const SUSPICIOUS_ASNS = [
  'AS14061', 'AS16509', 'AS13335', 'AS20473', 'AS63949', 'AS396982', 'AS8075',
  'AS15169', 'AS14618', 'AS45102', 'AS37963', 'AS24940', 'AS12876', 'AS51167',
  'AS201011', 'AS16276', 'AS35540', 'AS60781', 'AS28753', 'AS30633', 'AS60068',
  'AS36352', 'AS46606', 'AS55286', 'AS32097', 'AS20278', 'AS29802', 'AS62567',
  'AS394711', 'AS62563', 'AS9009', 'AS212238', 'AS136787', 'AS209103', 'AS398722',
  'AS394354', 'AS202425', 'AS206092', 'AS44477', 'AS9808', 'AS49981', 'AS200651',
  'AS51396', 'AS41378', 'AS35913', 'AS40676', 'AS25820', 'AS44592', 'AS62468',
  'AS9370', 'AS202448', 'AS211252', 'AS211298', 'AS211321', 'AS56971', 'AS51852',
  'AS42708', 'AS197540', 'AS174', 'AS3356', 'AS6939', 'AS7922', 'AS32748',
  'AS33387', 'AS30083', 'AS397423', 'AS395003', 'AS18779', 'AS54825', 'AS19624',
];

interface IPInfoLiteResponse {
  ip: string;
  country: string;
  country_name: string;
  continent: string;
  asn: string;
  as_name: string;
  as_domain: string;
}

async function checkIPWithLite(ip: string): Promise<{
  isFromBrazil: boolean;
  isSuspiciousASN: boolean;
  country: string | null;
  asn: string | null;
  asName: string | null;
}> {
  const ipinfoApiKey = Deno.env.get("IPINFO_API_KEY");
  
  if (!ipinfoApiKey || ip === "unknown") {
    return { isFromBrazil: true, isSuspiciousASN: false, country: null, asn: null, asName: null };
  }

  try {
    const response = await fetch(`https://api.ipinfo.io/lite/${ip}?token=${ipinfoApiKey}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      return { isFromBrazil: true, isSuspiciousASN: false, country: null, asn: null, asName: null };
    }

    const data: IPInfoLiteResponse = await response.json();
    
    return {
      isFromBrazil: data.country === 'BR',
      isSuspiciousASN: SUSPICIOUS_ASNS.includes(data.asn),
      country: data.country || null,
      asn: data.asn || null,
      asName: data.as_name || null,
    };
  } catch (error) {
    console.error("Error checking IP:", error);
    return { isFromBrazil: true, isSuspiciousASN: false, country: null, asn: null, asName: null };
  }
}

// Generate tracked redirect URL
function generateTrackedWhatsAppLink(baseLink: string, offerTitle: string, leadName: string): string {
  const waNumber = baseLink.replace('https://wa.me/', '').split('?')[0];
  const message = `Olá! Sou ${leadName}.\nVi a oferta "${offerTitle}" no CliLin e tenho interesse!`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

function generateTrackedSiteLink(baseLink: string, offerTitle: string, offerId: string, city: string): string {
  try {
    const url = new URL(baseLink);
    url.searchParams.set('utm_source', 'clilin');
    url.searchParams.set('utm_medium', 'lead');
    const campaign = offerTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').substring(0, 50);
    url.searchParams.set('utm_campaign', campaign);
    url.searchParams.set('clilin_ref', offerId.substring(0, 8));
    return url.toString();
  } catch {
    return baseLink;
  }
}

function getTrackedRedirectUrl(linkDestination: string, linkType: string, offerTitle: string, offerId: string, city: string, leadName: string): string {
  if (linkType === 'WHATSAPP' || linkDestination.includes('wa.me')) {
    return generateTrackedWhatsAppLink(linkDestination, offerTitle, leadName);
  }
  return generateTrackedSiteLink(linkDestination, offerTitle, offerId, city);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      offerId, 
      affiliateId, 
      name,
      phoneWhatsapp,
      fingerprint, 
      userAgent, 
      sessionToken,
      deviceId,
      timezoneOffset,
    } = await req.json();

    const clientIp = getClientIp(req);

    console.log(`Processing lead - Offer: ${offerId}, Name: ${name}, IP: ${clientIp}`);

    // Validate required fields
    if (!offerId || !name || !phoneWhatsapp) {
      return new Response(
        JSON.stringify({ error: "Nome e WhatsApp são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate name
    if (!validateName(name)) {
      return new Response(
        JSON.stringify({ error: "Por favor, informe seu nome completo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone
    const phoneValidation = validateBrazilianPhone(phoneWhatsapp);
    if (!phoneValidation.valid) {
      return new Response(
        JSON.stringify({ error: "Número de WhatsApp inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get offer details
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
        current_offer_score,
        profiles!offers_company_id_fkey(id, balance, user_id)
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

    // ========== IP VERIFICATION ==========
    const ipCheck = await checkIPWithLite(clientIp);
    
    if (!ipCheck.isFromBrazil && ipCheck.country !== null) {
      console.log(`Non-Brazilian IP: ${clientIp}, Country: ${ipCheck.country}`);
      
      // Still allow but mark as potentially invalid
      await supabase.from("leads").insert({
        offer_id: offerId,
        affiliate_id: null,
        name: name.trim(),
        phone_whatsapp: phoneValidation.cleaned,
        client_ip: clientIp,
        user_agent: userAgent,
        device_id: deviceId,
        is_valid: false,
      });

      const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);
      
      return new Response(
        JSON.stringify({ success: true, redirectUrl, charged: false, reason: "non_brazilian_ip" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (ipCheck.isSuspiciousASN) {
      console.log(`Suspicious ASN: ${ipCheck.asn} (${ipCheck.asName})`);
      
      await supabase.from("leads").insert({
        offer_id: offerId,
        affiliate_id: null,
        name: name.trim(),
        phone_whatsapp: phoneValidation.cleaned,
        client_ip: clientIp,
        user_agent: userAgent,
        device_id: deviceId,
        is_valid: false,
      });

      const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);
      
      return new Response(
        JSON.stringify({ success: true, redirectUrl, charged: false, reason: "suspicious_network" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== DUPLICATE CHECK ==========
    const phoneHash = hashPhone(phoneValidation.cleaned);
    
    const { data: existingRateLimit } = await supabase
      .from("lead_rate_limits")
      .select("*")
      .eq("phone_hash", phoneHash)
      .eq("offer_id", offerId)
      .maybeSingle();

    if (existingRateLimit) {
      const cooldownEnd = new Date(existingRateLimit.created_at);
      cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
      
      if (new Date() < cooldownEnd) {
        console.log(`Duplicate lead blocked: ${phoneHash} for offer ${offerId}`);
        
        // Still redirect, but don't charge
        const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);
        
        return new Response(
          JSON.stringify({ success: true, redirectUrl, charged: false, reason: "duplicate_lead" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ========== SESSION VALIDATION ==========
    if (sessionToken) {
      const { data: session } = await supabase
        .from("page_sessions")
        .select("*")
        .eq("session_token", sessionToken)
        .eq("offer_id", offerId)
        .maybeSingle();

      if (session) {
        const sessionAge = Date.now() - new Date(session.started_at).getTime();
        if (sessionAge < MIN_SESSION_AGE_MS) {
          console.log(`Session too young: ${sessionAge}ms`);
          const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);
          return new Response(
            JSON.stringify({ success: true, redirectUrl, charged: false, reason: "session_too_young" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ========== CALCULATE CPL ==========
    const { data: cplResult } = await supabase.rpc("calculate_real_cpl", {
      p_offer_id: offerId,
      p_city: offer.city,
    });

    const cplCents = cplResult || 150; // Default R$ 1,50
    console.log(`CPL for offer ${offerId}: ${cplCents} centavos`);

    // ========== CHECK COMPANY BALANCE ==========
    if (companyProfile.balance < cplCents) {
      console.log(`Insufficient balance: ${companyProfile.balance} < ${cplCents}`);
      
      // Save lead but mark as invalid (no charge)
      await supabase.from("leads").insert({
        offer_id: offerId,
        affiliate_id: affiliateId || null,
        name: name.trim(),
        phone_whatsapp: phoneValidation.cleaned,
        client_ip: clientIp,
        user_agent: userAgent,
        device_id: deviceId,
        fingerprint_hash: fingerprint,
        session_token: sessionToken,
        is_valid: false,
      });

      const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);
      
      return new Response(
        JSON.stringify({ success: true, redirectUrl, charged: false, reason: "insufficient_balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== DEBIT COMPANY ==========
    const { error: debitError } = await supabase
      .from("profiles")
      .update({ balance: companyProfile.balance - cplCents })
      .eq("id", companyProfile.id);

    if (debitError) {
      console.error("Error debiting company:", debitError);
      throw new Error("Failed to process payment");
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: companyProfile.id,
      amount: -cplCents,
      type: "LEAD_COST",
      description: `Lead: ${name.split(' ')[0]} - ${offer.title}`,
      offer_id: offerId,
    });

    // ========== CREDIT AFFILIATE (if exists) ==========
    let affiliateEarnings = 0;
    let validAffiliateId = affiliateId;

    if (affiliateId) {
      // Check if affiliate is valid
      const { data: affiliateProfile } = await supabase
        .from("profiles")
        .select("id, balance, banned, balance_frozen")
        .eq("id", affiliateId)
        .maybeSingle();

      if (affiliateProfile && !affiliateProfile.banned && !affiliateProfile.balance_frozen) {
        // Check if affiliate owns this offer (self-promotion)
        if (affiliateId === companyProfile.id) {
          console.log("Self-click detected - affiliate not credited");
          validAffiliateId = null;
        } else {
          // Get commission multiplier
          const { data: multiplier } = await supabase.rpc("get_commission_multiplier", {
            affiliate_profile_id: affiliateId,
          });

          const baseShare = 0.30; // 30% base
          const effectiveMultiplier = multiplier || 1.0;
          affiliateEarnings = Math.round(cplCents * baseShare * effectiveMultiplier);

          // Credit affiliate
          await supabase
            .from("profiles")
            .update({ balance: affiliateProfile.balance + affiliateEarnings })
            .eq("id", affiliateId);

          // Record transaction
          await supabase.from("transactions").insert({
            user_id: affiliateId,
            amount: affiliateEarnings,
            type: "LEAD_EARNING",
            description: `Comissão lead: ${offer.title}`,
            offer_id: offerId,
          });

          // Update affiliate stats
          await supabase.rpc("update_affiliate_stats_lead", {
            affiliate_profile_id: affiliateId,
            earnings: affiliateEarnings,
          });
        }
      } else {
        validAffiliateId = null;
      }
    }

    // ========== SAVE LEAD ==========
    await supabase.from("leads").insert({
      offer_id: offerId,
      affiliate_id: validAffiliateId,
      name: name.trim(),
      phone_whatsapp: phoneValidation.cleaned,
      client_ip: clientIp,
      user_agent: userAgent,
      device_id: deviceId,
      fingerprint_hash: fingerprint,
      session_token: sessionToken,
      is_valid: true,
    });

    // Save rate limit to prevent duplicates
    await supabase.from("lead_rate_limits").upsert({
      phone_hash: phoneHash,
      offer_id: offerId,
      created_at: new Date().toISOString(),
    }, { onConflict: 'phone_hash,offer_id' });

    // Increment leads count
    await supabase.rpc("increment_offer_leads", { offer_id: offerId });

    console.log(`Lead processed successfully - CPL: ${cplCents}, Affiliate earnings: ${affiliateEarnings}`);

    const redirectUrl = getTrackedRedirectUrl(offer.link_destination, offer.link_type, offer.title, offerId, offer.city, name);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        charged: true,
        cpl: cplCents,
        affiliateEarnings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing lead:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
